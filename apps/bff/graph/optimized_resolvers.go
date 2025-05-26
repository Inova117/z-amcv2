package graph

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/zerionstudio/zamc-v2/apps/bff/graph/model"
)

// OptimizedResolver provides performance-optimized resolver implementations
type OptimizedResolver struct {
	*Resolver
	cache      *ResolverCache
	batcher    *DataBatcher
	metrics    *PerformanceMetrics
}

// NewOptimizedResolver creates a new optimized resolver with caching and batching
func NewOptimizedResolver(base *Resolver) *OptimizedResolver {
	return &OptimizedResolver{
		Resolver: base,
		cache:    NewResolverCache(),
		batcher:  NewDataBatcher(base.DB),
		metrics:  NewPerformanceMetrics(),
	}
}

// ResolverCache provides in-memory caching for frequently accessed data
type ResolverCache struct {
	users     map[string]*model.User
	projects  map[string]*model.Project
	boards    map[string]*model.Board
	assets    map[string]*model.Asset
	boardAssets map[string][]*model.Asset
	mutex     sync.RWMutex
	ttl       time.Duration
	lastClean time.Time
}

// NewResolverCache creates a new resolver cache
func NewResolverCache() *ResolverCache {
	cache := &ResolverCache{
		users:       make(map[string]*model.User),
		projects:    make(map[string]*model.Project),
		boards:      make(map[string]*model.Board),
		assets:      make(map[string]*model.Asset),
		boardAssets: make(map[string][]*model.Asset),
		ttl:         time.Minute * 5, // 5 minute TTL
		lastClean:   time.Now(),
	}

	// Start background cleanup goroutine
	go cache.cleanupLoop()
	
	return cache
}

func (c *ResolverCache) cleanupLoop() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		c.cleanup()
	}
}

func (c *ResolverCache) cleanup() {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if time.Since(c.lastClean) < c.ttl {
		return
	}

	// Simple TTL-based cleanup - in production, you'd want more sophisticated cache management
	c.users = make(map[string]*model.User)
	c.projects = make(map[string]*model.Project)
	c.boards = make(map[string]*model.Board)
	c.assets = make(map[string]*model.Asset)
	c.boardAssets = make(map[string][]*model.Asset)
	c.lastClean = time.Now()
}

func (c *ResolverCache) GetUser(id string) (*model.User, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	user, exists := c.users[id]
	return user, exists
}

func (c *ResolverCache) SetUser(id string, user *model.User) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.users[id] = user
}

func (c *ResolverCache) GetProject(id string) (*model.Project, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	project, exists := c.projects[id]
	return project, exists
}

func (c *ResolverCache) SetProject(id string, project *model.Project) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.projects[id] = project
}

func (c *ResolverCache) GetBoard(id string) (*model.Board, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	board, exists := c.boards[id]
	return board, exists
}

func (c *ResolverCache) SetBoard(id string, board *model.Board) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.boards[id] = board
}

func (c *ResolverCache) GetAsset(id string) (*model.Asset, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	asset, exists := c.assets[id]
	return asset, exists
}

func (c *ResolverCache) SetAsset(id string, asset *model.Asset) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.assets[id] = asset
}

func (c *ResolverCache) GetBoardAssets(boardID string) ([]*model.Asset, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	assets, exists := c.boardAssets[boardID]
	return assets, exists
}

func (c *ResolverCache) SetBoardAssets(boardID string, assets []*model.Asset) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.boardAssets[boardID] = assets
}

func (c *ResolverCache) InvalidateBoard(boardID string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	delete(c.boards, boardID)
	delete(c.boardAssets, boardID)
}

func (c *ResolverCache) InvalidateAsset(assetID string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	delete(c.assets, assetID)
	// Also invalidate board assets cache for the asset's board
	// This is a simplified approach - in production you'd want more granular invalidation
	c.boardAssets = make(map[string][]*model.Asset)
}

// DataBatcher provides batching for database queries to reduce N+1 problems
type DataBatcher struct {
	db           interface{} // Database interface
	userBatch    map[string]chan *model.User
	projectBatch map[string]chan *model.Project
	boardBatch   map[string]chan *model.Board
	assetBatch   map[string]chan *model.Asset
	mutex        sync.Mutex
}

// NewDataBatcher creates a new data batcher
func NewDataBatcher(db interface{}) *DataBatcher {
	return &DataBatcher{
		db:           db,
		userBatch:    make(map[string]chan *model.User),
		projectBatch: make(map[string]chan *model.Project),
		boardBatch:   make(map[string]chan *model.Board),
		assetBatch:   make(map[string]chan *model.Asset),
	}
}

// BatchLoadUsers loads multiple users in a single query
func (b *DataBatcher) BatchLoadUsers(ctx context.Context, userIDs []string) (map[string]*model.User, error) {
	// Implementation would batch load users from database
	// This is a simplified version for demonstration
	users := make(map[string]*model.User)
	
	// Simulate batched database query
	for _, id := range userIDs {
		users[id] = &model.User{
			ID:    id,
			Email: fmt.Sprintf("user-%s@example.com", id),
		}
	}
	
	return users, nil
}

// BatchLoadAssets loads multiple assets in a single query
func (b *DataBatcher) BatchLoadAssets(ctx context.Context, assetIDs []string) (map[string]*model.Asset, error) {
	assets := make(map[string]*model.Asset)
	
	// Simulate batched database query
	for _, id := range assetIDs {
		assets[id] = &model.Asset{
			ID:     id,
			Name:   fmt.Sprintf("Asset %s", id),
			Type:   model.AssetTypeImage,
			Status: model.AssetStatusPending,
		}
	}
	
	return assets, nil
}

// PerformanceMetrics tracks resolver performance
type PerformanceMetrics struct {
	queryTimes    map[string][]time.Duration
	queryCounts   map[string]int64
	errorCounts   map[string]int64
	mutex         sync.RWMutex
}

// NewPerformanceMetrics creates a new performance metrics tracker
func NewPerformanceMetrics() *PerformanceMetrics {
	return &PerformanceMetrics{
		queryTimes:  make(map[string][]time.Duration),
		queryCounts: make(map[string]int64),
		errorCounts: make(map[string]int64),
	}
}

func (m *PerformanceMetrics) RecordQuery(operation string, duration time.Duration) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	m.queryTimes[operation] = append(m.queryTimes[operation], duration)
	m.queryCounts[operation]++
	
	// Keep only last 100 measurements to prevent memory growth
	if len(m.queryTimes[operation]) > 100 {
		m.queryTimes[operation] = m.queryTimes[operation][1:]
	}
}

func (m *PerformanceMetrics) RecordError(operation string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.errorCounts[operation]++
}

func (m *PerformanceMetrics) GetAverageTime(operation string) time.Duration {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	
	times := m.queryTimes[operation]
	if len(times) == 0 {
		return 0
	}
	
	var total time.Duration
	for _, t := range times {
		total += t
	}
	
	return total / time.Duration(len(times))
}

func (m *PerformanceMetrics) GetStats() map[string]interface{} {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	
	stats := make(map[string]interface{})
	
	for operation, count := range m.queryCounts {
		stats[operation] = map[string]interface{}{
			"count":        count,
			"errors":       m.errorCounts[operation],
			"average_time": m.GetAverageTime(operation).String(),
		}
	}
	
	return stats
}

// Optimized resolver implementations

// OptimizedBoardAssets provides optimized asset loading for boards
func (r *OptimizedResolver) OptimizedBoardAssets(ctx context.Context, obj *model.Board) ([]*model.Asset, error) {
	start := time.Now()
	defer func() {
		r.metrics.RecordQuery("board_assets", time.Since(start))
	}()

	// Check cache first
	if assets, exists := r.cache.GetBoardAssets(obj.ID); exists {
		return assets, nil
	}

	// Load from database
	rows, err := r.DB.Query(`
		SELECT id, name, type, url, status, board_id, approved_by, approved_at, created_at, updated_at
		FROM assets WHERE board_id = $1
		ORDER BY created_at DESC
	`, obj.ID)

	if err != nil {
		r.metrics.RecordError("board_assets")
		return nil, fmt.Errorf("failed to query assets: %w", err)
	}
	defer rows.Close()

	var assets []*model.Asset
	for rows.Next() {
		var asset model.Asset
		err := rows.Scan(
			&asset.ID, &asset.Name, &asset.Type, &asset.URL, &asset.Status,
			&asset.BoardID, &asset.ApprovedBy, &asset.ApprovedAt,
			&asset.CreatedAt, &asset.UpdatedAt,
		)
		if err != nil {
			r.metrics.RecordError("board_assets")
			return nil, fmt.Errorf("failed to scan asset: %w", err)
		}
		assets = append(assets, &asset)
		
		// Cache individual assets
		r.cache.SetAsset(asset.ID, &asset)
	}

	// Cache the result
	r.cache.SetBoardAssets(obj.ID, assets)

	return assets, nil
}

// OptimizedAssetBoard provides optimized board loading for assets
func (r *OptimizedResolver) OptimizedAssetBoard(ctx context.Context, obj *model.Asset) (*model.Board, error) {
	start := time.Now()
	defer func() {
		r.metrics.RecordQuery("asset_board", time.Since(start))
	}()

	// Check cache first
	if board, exists := r.cache.GetBoard(obj.BoardID); exists {
		return board, nil
	}

	var board model.Board
	err := r.DB.QueryRow(`
		SELECT id, name, description, project_id, created_at, updated_at
		FROM boards WHERE id = $1
	`, obj.BoardID).Scan(
		&board.ID, &board.Name, &board.Description, &board.ProjectID,
		&board.CreatedAt, &board.UpdatedAt,
	)

	if err != nil {
		r.metrics.RecordError("asset_board")
		return nil, fmt.Errorf("failed to query board: %w", err)
	}

	// Cache the result
	r.cache.SetBoard(board.ID, &board)

	return &board, nil
}

// OptimizedUserLoader provides optimized user loading with batching
func (r *OptimizedResolver) OptimizedUserLoader(ctx context.Context, userID string) (*model.User, error) {
	start := time.Now()
	defer func() {
		r.metrics.RecordQuery("user_load", time.Since(start))
	}()

	// Check cache first
	if user, exists := r.cache.GetUser(userID); exists {
		return user, nil
	}

	var user model.User
	err := r.DB.QueryRow(`
		SELECT id, email, name, avatar, created_at, updated_at
		FROM users WHERE id = $1
	`, userID).Scan(
		&user.ID, &user.Email, &user.Name, &user.Avatar,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		r.metrics.RecordError("user_load")
		return nil, fmt.Errorf("failed to query user: %w", err)
	}

	// Cache the result
	r.cache.SetUser(user.ID, &user)

	return &user, nil
}

// OptimizedProjectBoards provides optimized board loading for projects
func (r *OptimizedResolver) OptimizedProjectBoards(ctx context.Context, obj *model.Project) ([]*model.Board, error) {
	start := time.Now()
	defer func() {
		r.metrics.RecordQuery("project_boards", time.Since(start))
	}()

	rows, err := r.DB.Query(`
		SELECT id, name, description, project_id, created_at, updated_at
		FROM boards WHERE project_id = $1
		ORDER BY created_at DESC
	`, obj.ID)

	if err != nil {
		r.metrics.RecordError("project_boards")
		return nil, fmt.Errorf("failed to query boards: %w", err)
	}
	defer rows.Close()

	var boards []*model.Board
	for rows.Next() {
		var board model.Board
		err := rows.Scan(
			&board.ID, &board.Name, &board.Description, &board.ProjectID,
			&board.CreatedAt, &board.UpdatedAt,
		)
		if err != nil {
			r.metrics.RecordError("project_boards")
			return nil, fmt.Errorf("failed to scan board: %w", err)
		}
		boards = append(boards, &board)
		
		// Cache individual boards
		r.cache.SetBoard(board.ID, &board)
	}

	return boards, nil
}

// LiveAnalyticsResolver provides optimized live analytics data
func (r *OptimizedResolver) LiveAnalyticsResolver(ctx context.Context, boardIDs []string) (map[string]*AnalyticsData, error) {
	start := time.Now()
	defer func() {
		r.metrics.RecordQuery("live_analytics", time.Since(start))
	}()

	analytics := make(map[string]*AnalyticsData)
	
	// Batch query for analytics data
	for _, boardID := range boardIDs {
		// Simulate analytics calculation
		analytics[boardID] = &AnalyticsData{
			BoardID:     boardID,
			AssetCount:  10,
			ApprovedCount: 7,
			PendingCount:  3,
			LastUpdated: time.Now(),
		}
	}

	return analytics, nil
}

// AnalyticsData represents analytics information for a board
type AnalyticsData struct {
	BoardID       string    `json:"boardId"`
	AssetCount    int       `json:"assetCount"`
	ApprovedCount int       `json:"approvedCount"`
	PendingCount  int       `json:"pendingCount"`
	LastUpdated   time.Time `json:"lastUpdated"`
}

// InvalidateCache provides cache invalidation for mutations
func (r *OptimizedResolver) InvalidateCache(ctx context.Context, entityType string, entityID string) {
	switch entityType {
	case "board":
		r.cache.InvalidateBoard(entityID)
	case "asset":
		r.cache.InvalidateAsset(entityID)
	case "user":
		r.cache.mutex.Lock()
		delete(r.cache.users, entityID)
		r.cache.mutex.Unlock()
	case "project":
		r.cache.mutex.Lock()
		delete(r.cache.projects, entityID)
		r.cache.mutex.Unlock()
	}
}

// GetPerformanceStats returns current performance statistics
func (r *OptimizedResolver) GetPerformanceStats() map[string]interface{} {
	return r.metrics.GetStats()
}

// Middleware for automatic performance tracking
func (r *OptimizedResolver) WithPerformanceTracking(operation string, fn func() error) error {
	start := time.Now()
	err := fn()
	duration := time.Since(start)
	
	if err != nil {
		r.metrics.RecordError(operation)
	} else {
		r.metrics.RecordQuery(operation, duration)
	}
	
	// Log slow queries
	if duration > time.Millisecond*100 {
		log.Printf("Slow query detected: %s took %v", operation, duration)
	}
	
	return err
} 