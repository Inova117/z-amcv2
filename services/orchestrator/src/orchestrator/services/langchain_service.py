"""LangChain service for AI strategy and content generation."""

import logging
from typing import Any, Dict, List, Optional

from langchain.chains import LLMChain
from langchain.embeddings import OpenAIEmbeddings
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
from langchain_openai import ChatOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings
from ..models import (
    ContentDraft,
    ContentType,
    MarketingStrategy,
    ProjectInfo,
    StrategyPhase,
    StrategyStatus,
)

logger = logging.getLogger(__name__)


class StrategyOutputParser(BaseOutputParser):
    """Custom output parser for marketing strategy generation."""

    def parse(self, text: str) -> Dict[str, Any]:
        """Parse the LLM output into structured strategy data."""
        try:
            # This is a simplified parser - in production, you'd want more robust parsing
            lines = text.strip().split('\n')
            strategy_data = {
                "title": "",
                "description": "",
                "target_audience": "",
                "brand_positioning": "",
                "key_messages": [],
                "phases": [],
                "content_calendar_overview": "",
                "budget_considerations": [],
                "success_metrics": [],
            }

            current_section = None
            current_phase = None

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Parse sections
                if line.startswith("TITLE:"):
                    strategy_data["title"] = line.replace("TITLE:", "").strip()
                elif line.startswith("DESCRIPTION:"):
                    strategy_data["description"] = line.replace("DESCRIPTION:", "").strip()
                elif line.startswith("TARGET_AUDIENCE:"):
                    strategy_data["target_audience"] = line.replace("TARGET_AUDIENCE:", "").strip()
                elif line.startswith("BRAND_POSITIONING:"):
                    strategy_data["brand_positioning"] = line.replace("BRAND_POSITIONING:", "").strip()
                elif line.startswith("KEY_MESSAGES:"):
                    current_section = "key_messages"
                elif line.startswith("PHASES:"):
                    current_section = "phases"
                elif line.startswith("CONTENT_CALENDAR:"):
                    strategy_data["content_calendar_overview"] = line.replace("CONTENT_CALENDAR:", "").strip()
                elif line.startswith("BUDGET:"):
                    current_section = "budget"
                elif line.startswith("METRICS:"):
                    current_section = "metrics"
                elif line.startswith("PHASE"):
                    # Parse phase information
                    if current_section == "phases":
                        phase_info = line.split(":")
                        if len(phase_info) >= 2:
                            phase_number = int(phase_info[0].replace("PHASE", "").strip())
                            phase_name = phase_info[1].strip()
                            current_phase = {
                                "phase_number": phase_number,
                                "name": phase_name,
                                "duration_days": 30,  # Default
                                "objectives": [],
                                "key_activities": [],
                                "success_metrics": [],
                                "content_focus": [ContentType.BLOG_POST, ContentType.SOCIAL_MEDIA],
                            }
                            strategy_data["phases"].append(current_phase)
                elif line.startswith("-") or line.startswith("•"):
                    # Parse list items
                    item = line.replace("-", "").replace("•", "").strip()
                    if current_section == "key_messages":
                        strategy_data["key_messages"].append(item)
                    elif current_section == "budget":
                        strategy_data["budget_considerations"].append(item)
                    elif current_section == "metrics":
                        strategy_data["success_metrics"].append(item)
                    elif current_phase and current_section == "phases":
                        current_phase["objectives"].append(item)

            return strategy_data

        except Exception as e:
            logger.error(f"Failed to parse strategy output: {e}")
            # Return default structure
            return {
                "title": "Generated Marketing Strategy",
                "description": "AI-generated 90-day marketing strategy",
                "target_audience": "Target audience to be defined",
                "brand_positioning": "Brand positioning to be defined",
                "key_messages": ["Key message 1", "Key message 2"],
                "phases": [
                    {
                        "phase_number": 1,
                        "name": "Foundation Phase",
                        "duration_days": 30,
                        "objectives": ["Establish brand presence"],
                        "key_activities": ["Content creation", "Audience research"],
                        "success_metrics": ["Engagement rate", "Reach"],
                        "content_focus": [ContentType.BLOG_POST, ContentType.SOCIAL_MEDIA],
                    }
                ],
                "content_calendar_overview": "Comprehensive content calendar spanning 90 days",
                "budget_considerations": ["Content creation costs", "Advertising budget"],
                "success_metrics": ["ROI", "Engagement", "Conversions"],
            }


class LangChainService:
    """Service for AI-powered strategy and content generation using LangChain."""

    def __init__(self) -> None:
        """Initialize LangChain service."""
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            temperature=settings.openai_temperature,
            max_tokens=settings.openai_max_tokens,
            openai_api_key=settings.openai_api_key,
        )
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.openai_api_key
        )
        self.strategy_parser = StrategyOutputParser()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
    )
    async def generate_strategy(self, project_info: ProjectInfo) -> MarketingStrategy:
        """Generate a 90-day marketing strategy for a project."""
        try:
            strategy_prompt = PromptTemplate(
                input_variables=[
                    "project_name",
                    "project_description",
                    "industry",
                    "target_audience",
                    "brand_voice",
                    "goals",
                ],
                template="""
You are an expert marketing strategist. Create a comprehensive 90-day marketing strategy for the following project:

Project Name: {project_name}
Description: {project_description}
Industry: {industry}
Target Audience: {target_audience}
Brand Voice: {brand_voice}
Goals: {goals}

Please provide a detailed strategy with the following structure:

TITLE: [Strategy Title]
DESCRIPTION: [Brief strategy description]
TARGET_AUDIENCE: [Refined target audience definition]
BRAND_POSITIONING: [Brand positioning statement]

KEY_MESSAGES:
- [Key message 1]
- [Key message 2]
- [Key message 3]

PHASES:
PHASE 1: Foundation & Awareness (Days 1-30)
- Objective 1
- Objective 2
- Key Activity 1
- Key Activity 2

PHASE 2: Engagement & Growth (Days 31-60)
- Objective 1
- Objective 2
- Key Activity 1
- Key Activity 2

PHASE 3: Conversion & Optimization (Days 61-90)
- Objective 1
- Objective 2
- Key Activity 1
- Key Activity 2

CONTENT_CALENDAR: [Overview of content calendar approach]

BUDGET:
- [Budget consideration 1]
- [Budget consideration 2]
- [Budget consideration 3]

METRICS:
- [Success metric 1]
- [Success metric 2]
- [Success metric 3]

Make the strategy specific, actionable, and tailored to the project's industry and goals.
                """,
            )

            chain = LLMChain(llm=self.llm, prompt=strategy_prompt)

            # Prepare input data
            input_data = {
                "project_name": project_info.name,
                "project_description": project_info.description or "No description provided",
                "industry": project_info.industry or "General",
                "target_audience": project_info.target_audience or "General audience",
                "brand_voice": project_info.brand_voice or "Professional and engaging",
                "goals": ", ".join(project_info.goals) if project_info.goals else "Increase brand awareness and engagement",
            }

            # Generate strategy
            result = await chain.arun(**input_data)
            strategy_data = self.strategy_parser.parse(result)

            # Create strategy phases
            phases = []
            for phase_data in strategy_data["phases"]:
                phase = StrategyPhase(
                    phase_number=phase_data["phase_number"],
                    name=phase_data["name"],
                    duration_days=phase_data["duration_days"],
                    objectives=phase_data["objectives"],
                    key_activities=phase_data["key_activities"],
                    success_metrics=phase_data["success_metrics"],
                    content_focus=phase_data["content_focus"],
                )
                phases.append(phase)

            # Create marketing strategy
            strategy = MarketingStrategy(
                project_id=project_info.id,
                title=strategy_data["title"],
                description=strategy_data["description"],
                target_audience=strategy_data["target_audience"],
                brand_positioning=strategy_data["brand_positioning"],
                key_messages=strategy_data["key_messages"],
                phases=phases,
                content_calendar_overview=strategy_data["content_calendar_overview"],
                budget_considerations=strategy_data["budget_considerations"],
                success_metrics=strategy_data["success_metrics"],
                status=StrategyStatus.COMPLETED,
            )

            logger.info(f"Generated strategy for project {project_info.id}")
            return strategy

        except Exception as e:
            logger.error(f"Failed to generate strategy: {e}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
    )
    async def generate_content_draft(
        self,
        content_type: ContentType,
        strategy: MarketingStrategy,
        additional_context: Optional[str] = None,
    ) -> ContentDraft:
        """Generate a content draft based on strategy and content type."""
        try:
            content_prompts = {
                ContentType.BLOG_POST: """
Write a blog post outline and introduction for the following marketing strategy:

Strategy: {strategy_title}
Target Audience: {target_audience}
Brand Positioning: {brand_positioning}
Key Messages: {key_messages}
Additional Context: {additional_context}

Provide:
TITLE: [Blog post title]
OUTLINE:
- Introduction
- Main points (3-5 bullet points)
- Conclusion

INTRODUCTION: [Write the full introduction paragraph]
                """,
                ContentType.SOCIAL_MEDIA: """
Create social media post ideas for the following marketing strategy:

Strategy: {strategy_title}
Target Audience: {target_audience}
Key Messages: {key_messages}
Additional Context: {additional_context}

Provide 5 social media post ideas with:
TITLE: Social Media Content Pack
POST 1: [Platform: LinkedIn/Twitter/Instagram] - [Post content]
POST 2: [Platform: LinkedIn/Twitter/Instagram] - [Post content]
POST 3: [Platform: LinkedIn/Twitter/Instagram] - [Post content]
POST 4: [Platform: LinkedIn/Twitter/Instagram] - [Post content]
POST 5: [Platform: LinkedIn/Twitter/Instagram] - [Post content]
                """,
                ContentType.EMAIL_CAMPAIGN: """
Create an email campaign for the following marketing strategy:

Strategy: {strategy_title}
Target Audience: {target_audience}
Key Messages: {key_messages}
Additional Context: {additional_context}

Provide:
TITLE: [Email campaign title]
SUBJECT_LINE: [Email subject line]
PREVIEW_TEXT: [Preview text]
EMAIL_CONTENT: [Full email content with clear structure]
                """,
                ContentType.VIDEO_SCRIPT: """
Write a video script for the following marketing strategy:

Strategy: {strategy_title}
Target Audience: {target_audience}
Key Messages: {key_messages}
Additional Context: {additional_context}

Provide:
TITLE: [Video title]
DURATION: [Estimated duration]
SCRIPT:
[Scene 1: Introduction - 0:00-0:15]
[Scene 2: Main content - 0:15-1:30]
[Scene 3: Call to action - 1:30-1:45]
                """,
                ContentType.INFOGRAPHIC: """
Design an infographic concept for the following marketing strategy:

Strategy: {strategy_title}
Target Audience: {target_audience}
Key Messages: {key_messages}
Additional Context: {additional_context}

Provide:
TITLE: [Infographic title]
LAYOUT: [Description of visual layout]
SECTIONS:
- Section 1: [Title and key points]
- Section 2: [Title and key points]
- Section 3: [Title and key points]
DESIGN_NOTES: [Color scheme, style, visual elements]
                """,
            }

            prompt_template = content_prompts.get(content_type, content_prompts[ContentType.BLOG_POST])
            
            prompt = PromptTemplate(
                input_variables=[
                    "strategy_title",
                    "target_audience",
                    "brand_positioning",
                    "key_messages",
                    "additional_context",
                ],
                template=prompt_template,
            )

            chain = LLMChain(llm=self.llm, prompt=prompt)

            # Prepare input data
            input_data = {
                "strategy_title": strategy.title,
                "target_audience": strategy.target_audience,
                "brand_positioning": strategy.brand_positioning,
                "key_messages": ", ".join(strategy.key_messages),
                "additional_context": additional_context or "No additional context",
            }

            # Generate content
            result = await chain.arun(**input_data)

            # Extract title from result
            lines = result.strip().split('\n')
            title = f"{content_type.value.replace('_', ' ').title()} for {strategy.title}"
            for line in lines:
                if line.startswith("TITLE:"):
                    title = line.replace("TITLE:", "").strip()
                    break

            # Create content draft
            draft = ContentDraft(
                project_id=strategy.project_id,
                strategy_id=strategy.id,
                content_type=content_type,
                title=title,
                content=result,
                metadata={
                    "strategy_title": strategy.title,
                    "content_type": content_type.value,
                    "generated_by": "langchain",
                },
            )

            logger.info(f"Generated {content_type.value} content draft for strategy {strategy.id}")
            return draft

        except Exception as e:
            logger.error(f"Failed to generate content draft: {e}")
            raise

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI embeddings."""
        try:
            embedding = await self.embeddings.aembed_query(text)
            return embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

    async def generate_strategy_embedding(self, strategy: MarketingStrategy) -> List[float]:
        """Generate embedding for a marketing strategy."""
        # Combine key strategy elements for embedding
        strategy_text = f"""
        {strategy.title}
        {strategy.description}
        Target Audience: {strategy.target_audience}
        Brand Positioning: {strategy.brand_positioning}
        Key Messages: {' '.join(strategy.key_messages)}
        """
        return await self.generate_embedding(strategy_text.strip())

    async def generate_content_embedding(self, draft: ContentDraft) -> List[float]:
        """Generate embedding for a content draft."""
        # Combine title and content preview for embedding
        content_text = f"{draft.title}\n{draft.content[:1000]}"
        return await self.generate_embedding(content_text) 