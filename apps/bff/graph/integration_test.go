package graph

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	_ "github.com/lib/pq"
	"github.com/zerionstudio/zamc-v2/apps/bff/graph/model"
	"github.com/zerionstudio/zamc-v2/apps/bff/internal/auth"
	"github.com/zerionstudio/zamc-v2/apps/bff/internal/database"
)

// IntegrationTestSuite provides a test suite for integration tests
type IntegrationTestSuite struct {
	suite.Suite
	db       *sql.DB
	resolver *Resolver
	ctx      context.Context
	userID   string
}

// SetupSuite runs once before all tests in the suite
func (suite *IntegrationTestSuite) SetupSuite() {
	// Skip integration tests if not in integration test mode
	if testing.Short() {
		suite.T().Skip("Skipping integration tests in short mode")
		return
	}

	// Setup test database connection
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:password@localhost:5432/zamc_test?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	require.NoError(suite.T(), err)

	err = db.Ping()
	require.NoError(suite.T(), err)

	suite.db = db

	// Setup test resolver with real dependencies
	dbWrapper := &database.DB{DB: db}
	
	// For integration tests, we'll use nil for NATS and Auth since we're testing database operations
	// In a real scenario, you'd set up test instances of these services
	suite.resolver = &Resolver{
		DB:          dbWrapper,
		NatsConn:    nil, // Will be mocked in individual tests if needed
		AuthService: nil, // Will be mocked in individual tests if needed
	}

	// Create test user context
	suite.userID = uuid.New().String()
	user := &auth.User{
		ID:    suite.userID,
		Email: "integration@test.com",
	}
	suite.ctx = context.WithValue(context.Background(), "user", user)
}

// TearDownSuite runs once after all tests in the suite
func (suite *IntegrationTestSuite) TearDownSuite() {
	if suite.db != nil {
		suite.db.Close()
	}
}

// SetupTest runs before each test
func (suite *IntegrationTestSuite) SetupTest() {
	// Clean up test data
	suite.cleanupTestData()
	
	// Insert test user
	_, err := suite.db.Exec(`
		INSERT INTO users (id, email, name, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (id) DO NOTHING
	`, suite.userID, "integration@test.com", "Integration Test User", time.Now(), time.Now())
	require.NoError(suite.T(), err)
}

// TearDownTest runs after each test
func (suite *IntegrationTestSuite) TearDownTest() {
	suite.cleanupTestData()
}

func (suite *IntegrationTestSuite) cleanupTestData() {
	// Clean up in reverse dependency order
	suite.db.Exec("DELETE FROM assets WHERE board_id IN (SELECT id FROM boards WHERE project_id IN (SELECT id FROM projects WHERE owner_id = $1))", suite.userID)
	suite.db.Exec("DELETE FROM chat_messages WHERE board_id IN (SELECT id FROM boards WHERE project_id IN (SELECT id FROM projects WHERE owner_id = $1))", suite.userID)
	suite.db.Exec("DELETE FROM boards WHERE project_id IN (SELECT id FROM projects WHERE owner_id = $1)", suite.userID)
	suite.db.Exec("DELETE FROM projects WHERE owner_id = $1", suite.userID)
}

	// Test implementations
	func (suite *IntegrationTestSuite) TestQueryResolver_Me() {
		queryResolver := &queryResolver{suite.resolver}

		result, err := queryResolver.Me(suite.ctx)
		
		require.NoError(suite.T(), err)
		require.NotNil(suite.T(), result)
		assert.Equal(suite.T(), suite.userID, result.ID)
		assert.Equal(suite.T(), "integration@test.com", result.Email)
	}

func (suite *IntegrationTestSuite) TestProjectLifecycle() {
	mutationResolver := &mutationResolver{suite.resolver}
	queryResolver := &queryResolver{suite.resolver}

	// Create project
	createInput := model.CreateProjectInput{
		Name:        "Integration Test Project",
		Description: stringPtr("Test project for integration testing"),
	}

	project, err := mutationResolver.CreateProject(suite.ctx, createInput)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), project)
	assert.Equal(suite.T(), createInput.Name, project.Name)
	assert.Equal(suite.T(), suite.userID, project.OwnerID)

	// Query projects
	projects, err := queryResolver.Projects(suite.ctx)
	require.NoError(suite.T(), err)
	require.Len(suite.T(), projects, 1)
	assert.Equal(suite.T(), project.ID, projects[0].ID)

	// Query specific project
	queriedProject, err := queryResolver.Project(suite.ctx, project.ID)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), queriedProject)
	assert.Equal(suite.T(), project.ID, queriedProject.ID)
}

func (suite *IntegrationTestSuite) TestBoardLifecycle() {
	mutationResolver := &mutationResolver{suite.resolver}
	queryResolver := &queryResolver{suite.resolver}

	// First create a project
	project, err := mutationResolver.CreateProject(suite.ctx, model.CreateProjectInput{
		Name: "Test Project for Board",
	})
	require.NoError(suite.T(), err)

	// Create board
	createInput := model.CreateBoardInput{
		Name:        "Integration Test Board",
		Description: stringPtr("Test board for integration testing"),
		ProjectID:   project.ID,
	}

	board, err := mutationResolver.CreateBoard(suite.ctx, createInput)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), board)
	assert.Equal(suite.T(), createInput.Name, board.Name)
	assert.Equal(suite.T(), project.ID, board.ProjectID)

	// Query board
	queriedBoard, err := queryResolver.Board(suite.ctx, board.ID)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), queriedBoard)
	assert.Equal(suite.T(), board.ID, queriedBoard.ID)

	// Test project resolver - boards
	projectResolver := &projectResolver{suite.resolver}
	boards, err := projectResolver.Boards(suite.ctx, project)
	require.NoError(suite.T(), err)
	require.Len(suite.T(), boards, 1)
	assert.Equal(suite.T(), board.ID, boards[0].ID)
}

func (suite *IntegrationTestSuite) TestAssetLifecycle() {
	mutationResolver := &mutationResolver{suite.resolver}

	// Setup project and board
	project, err := mutationResolver.CreateProject(suite.ctx, model.CreateProjectInput{
		Name: "Test Project for Assets",
	})
	require.NoError(suite.T(), err)

	board, err := mutationResolver.CreateBoard(suite.ctx, model.CreateBoardInput{
		Name:      "Test Board for Assets",
		ProjectID: project.ID,
	})
	require.NoError(suite.T(), err)

	// Upload asset
	uploadInput := model.UploadAssetInput{
		Name:    "integration-test-asset.jpg",
		Type:    model.AssetTypeImage,
		URL:     "https://example.com/integration-test-asset.jpg",
		BoardID: board.ID,
	}

	asset, err := mutationResolver.UploadAsset(suite.ctx, uploadInput)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), asset)
	assert.Equal(suite.T(), uploadInput.Name, asset.Name)
	assert.Equal(suite.T(), uploadInput.Type, asset.Type)
	assert.Equal(suite.T(), model.AssetStatusPending, asset.Status)
	assert.Equal(suite.T(), board.ID, asset.BoardID)

	// Test board resolver - assets
	boardResolver := &boardResolver{suite.resolver}
	assets, err := boardResolver.Assets(suite.ctx, board)
	require.NoError(suite.T(), err)
	require.Len(suite.T(), assets, 1)
	assert.Equal(suite.T(), asset.ID, assets[0].ID)

	// Test asset resolver - board
	assetResolver := &assetResolver{suite.resolver}
	assetBoard, err := assetResolver.Board(suite.ctx, asset)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), assetBoard)
	assert.Equal(suite.T(), board.ID, assetBoard.ID)

	// Approve asset
	approvedAsset, err := mutationResolver.ApproveAsset(suite.ctx, asset.ID)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), approvedAsset)
	assert.Equal(suite.T(), model.AssetStatusApproved, approvedAsset.Status)
	assert.Equal(suite.T(), suite.userID, *approvedAsset.ApprovedBy)
	assert.NotNil(suite.T(), approvedAsset.ApprovedAt)

	// Test asset resolver - approvedBy
	approver, err := assetResolver.ApprovedBy(suite.ctx, approvedAsset)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), approver)
	assert.Equal(suite.T(), suite.userID, approver.ID)
}

func (suite *IntegrationTestSuite) TestChatLifecycle() {
	mutationResolver := &mutationResolver{suite.resolver}
	queryResolver := &queryResolver{suite.resolver}

	// Setup project and board
	project, err := mutationResolver.CreateProject(suite.ctx, model.CreateProjectInput{
		Name: "Test Project for Chat",
	})
	require.NoError(suite.T(), err)

	board, err := mutationResolver.CreateBoard(suite.ctx, model.CreateBoardInput{
		Name:      "Test Board for Chat",
		ProjectID: project.ID,
	})
	require.NoError(suite.T(), err)

	// Send chat message
	message, err := mutationResolver.Chat(suite.ctx, board.ID, "Hello, this is a test message!")
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), message)
	assert.Equal(suite.T(), "Hello, this is a test message!", message.Content)
	assert.Equal(suite.T(), suite.userID, message.UserID)
	assert.Equal(suite.T(), board.ID, message.BoardID)

	// Query chat messages
	messages, err := queryResolver.ChatMessages(suite.ctx, board.ID, nil, nil)
	require.NoError(suite.T(), err)
	require.Len(suite.T(), messages, 1)
	assert.Equal(suite.T(), message.ID, messages[0].ID)

	// Test chat message resolvers
	chatMessageResolver := &chatMessageResolver{suite.resolver}
	
	// Test user resolver
	user, err := chatMessageResolver.User(suite.ctx, message)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), user)
	assert.Equal(suite.T(), suite.userID, user.ID)

	// Test board resolver
	messageBoard, err := chatMessageResolver.Board(suite.ctx, message)
	require.NoError(suite.T(), err)
	require.NotNil(suite.T(), messageBoard)
	assert.Equal(suite.T(), board.ID, messageBoard.ID)
}

func (suite *IntegrationTestSuite) TestComplexScenario() {
	// Test a complex scenario with multiple entities
	mutationResolver := &mutationResolver{suite.resolver}
	queryResolver := &queryResolver{suite.resolver}

	// Create multiple projects
	projects := make([]*model.Project, 3)
	for i := 0; i < 3; i++ {
		project, err := mutationResolver.CreateProject(suite.ctx, model.CreateProjectInput{
			Name: fmt.Sprintf("Complex Test Project %d", i+1),
		})
		require.NoError(suite.T(), err)
		projects[i] = project
	}

	// Create multiple boards per project
	boards := make([]*model.Board, 0)
	for _, project := range projects {
		for j := 0; j < 2; j++ {
			board, err := mutationResolver.CreateBoard(suite.ctx, model.CreateBoardInput{
				Name:      fmt.Sprintf("Board %d for Project %s", j+1, project.Name),
				ProjectID: project.ID,
			})
			require.NoError(suite.T(), err)
			boards = append(boards, board)
		}
	}

	// Upload multiple assets per board
	assets := make([]*model.Asset, 0)
	for _, board := range boards {
		for k := 0; k < 3; k++ {
			asset, err := mutationResolver.UploadAsset(suite.ctx, model.UploadAssetInput{
				Name:    fmt.Sprintf("asset-%d-board-%s.jpg", k+1, board.ID),
				Type:    model.AssetTypeImage,
				URL:     fmt.Sprintf("https://example.com/asset-%d.jpg", k+1),
				BoardID: board.ID,
			})
			require.NoError(suite.T(), err)
			assets = append(assets, asset)
		}
	}

	// Verify data integrity
	allProjects, err := queryResolver.Projects(suite.ctx)
	require.NoError(suite.T(), err)
	assert.Len(suite.T(), allProjects, 3)

	// Test performance with multiple queries
	start := time.Now()
	for _, project := range allProjects {
		projectResolver := &projectResolver{suite.resolver}
		projectBoards, err := projectResolver.Boards(suite.ctx, project)
		require.NoError(suite.T(), err)
		assert.Len(suite.T(), projectBoards, 2)

		for _, board := range projectBoards {
			boardResolver := &boardResolver{suite.resolver}
			boardAssets, err := boardResolver.Assets(suite.ctx, board)
			require.NoError(suite.T(), err)
			assert.Len(suite.T(), boardAssets, 3)
		}
	}
	duration := time.Since(start)
	
	// Performance assertion - should complete within reasonable time
	assert.Less(suite.T(), duration, time.Second*5, "Complex query should complete within 5 seconds")
}

func (suite *IntegrationTestSuite) TestConcurrentOperations() {
	// Test concurrent asset uploads
	mutationResolver := &mutationResolver{suite.resolver}

	// Setup project and board
	project, err := mutationResolver.CreateProject(suite.ctx, model.CreateProjectInput{
		Name: "Concurrent Test Project",
	})
	require.NoError(suite.T(), err)

	board, err := mutationResolver.CreateBoard(suite.ctx, model.CreateBoardInput{
		Name:      "Concurrent Test Board",
		ProjectID: project.ID,
	})
	require.NoError(suite.T(), err)

	// Concurrent asset uploads
	const numConcurrent = 10
	results := make(chan *model.Asset, numConcurrent)
	errors := make(chan error, numConcurrent)

	for i := 0; i < numConcurrent; i++ {
		go func(index int) {
			asset, err := mutationResolver.UploadAsset(suite.ctx, model.UploadAssetInput{
				Name:    fmt.Sprintf("concurrent-asset-%d.jpg", index),
				Type:    model.AssetTypeImage,
				URL:     fmt.Sprintf("https://example.com/concurrent-%d.jpg", index),
				BoardID: board.ID,
			})
			if err != nil {
				errors <- err
			} else {
				results <- asset
			}
		}(i)
	}

	// Collect results
	var assets []*model.Asset
	for i := 0; i < numConcurrent; i++ {
		select {
		case asset := <-results:
			assets = append(assets, asset)
		case err := <-errors:
			suite.T().Errorf("Concurrent upload failed: %v", err)
		case <-time.After(time.Second * 10):
			suite.T().Fatal("Concurrent upload timed out")
		}
	}

	assert.Len(suite.T(), assets, numConcurrent)

	// Verify all assets were created
	boardResolver := &boardResolver{suite.resolver}
	boardAssets, err := boardResolver.Assets(suite.ctx, board)
	require.NoError(suite.T(), err)
	assert.Len(suite.T(), boardAssets, numConcurrent)
}

// Test helper implementations - these are kept for reference but not used in integration tests
// In integration tests, we focus on database operations and use nil for external services

// Run the integration test suite
func TestIntegrationSuite(t *testing.T) {
	// Skip integration tests if not in integration test mode
	if testing.Short() {
		t.Skip("Skipping integration tests in short mode")
		return
	}

	suite.Run(t, new(IntegrationTestSuite))
} 