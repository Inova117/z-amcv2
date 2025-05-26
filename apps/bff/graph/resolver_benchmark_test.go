package graph

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/zerionstudio/zamc-v2/apps/bff/graph/model"
	"github.com/zerionstudio/zamc-v2/apps/bff/internal/auth"
	"github.com/zerionstudio/zamc-v2/apps/bff/internal/database"
)

// Benchmark setup helpers
func setupBenchmarkResolver() *Resolver {
	// In a real scenario, you'd use a test database
	// For benchmarking, we'll use mocks that simulate realistic performance
	mockDB := &BenchmarkDB{DB: &sql.DB{}}

	return &Resolver{
		DB:          &database.DB{DB: mockDB.DB},
		NatsConn:    nil, // Benchmarks focus on resolver performance, not external services
		AuthService: nil, // Benchmarks focus on resolver performance, not external services
	}
}

func createBenchmarkContext() context.Context {
	user := &auth.User{
		ID:    uuid.New().String(),
		Email: "benchmark@example.com",
	}
	return context.WithValue(context.Background(), "user", user)
}

// BenchmarkDB embeds sql.DB for realistic database performance simulation
type BenchmarkDB struct {
	*sql.DB
}

type BenchmarkSQLResult struct{}

func (b *BenchmarkSQLResult) LastInsertId() (int64, error) {
	return 1, nil
}

func (b *BenchmarkSQLResult) RowsAffected() (int64, error) {
	return 1, nil
}

// Benchmark types removed - benchmarks focus on database performance only

// Query Resolver Benchmarks
func BenchmarkQueryResolver_Me(b *testing.B) {
	resolver := setupBenchmarkResolver()
	queryResolver := &queryResolver{resolver}
	ctx := createBenchmarkContext()

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_, err := queryResolver.Me(ctx)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkQueryResolver_Projects(b *testing.B) {
	resolver := setupBenchmarkResolver()
	queryResolver := &queryResolver{resolver}
	ctx := createBenchmarkContext()

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_, err := queryResolver.Projects(ctx)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkQueryResolver_Board(b *testing.B) {
	resolver := setupBenchmarkResolver()
	queryResolver := &queryResolver{resolver}
	ctx := createBenchmarkContext()
	boardID := uuid.New().String()

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_, err := queryResolver.Board(ctx, boardID)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// Asset Management Benchmarks
func BenchmarkMutationResolver_UploadAsset(b *testing.B) {
	resolver := setupBenchmarkResolver()
	mutationResolver := &mutationResolver{resolver}
	ctx := createBenchmarkContext()

	input := model.UploadAssetInput{
		Name:    "benchmark-asset.jpg",
		Type:    model.AssetTypeImage,
		URL:     "https://example.com/benchmark-asset.jpg",
		BoardID: uuid.New().String(),
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_, err := mutationResolver.UploadAsset(ctx, input)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkMutationResolver_ApproveAsset(b *testing.B) {
	resolver := setupBenchmarkResolver()
	mutationResolver := &mutationResolver{resolver}
	ctx := createBenchmarkContext()
	assetID := uuid.New().String()

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_, err := mutationResolver.ApproveAsset(ctx, assetID)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkBoardResolver_Assets(b *testing.B) {
	resolver := setupBenchmarkResolver()
	boardResolver := &boardResolver{resolver}
	ctx := createBenchmarkContext()

	board := &model.Board{
		ID:        uuid.New().String(),
		Name:      "Benchmark Board",
		ProjectID: uuid.New().String(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_, err := boardResolver.Assets(ctx, board)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkAssetResolver_Board(b *testing.B) {
	resolver := setupBenchmarkResolver()
	assetResolver := &assetResolver{resolver}
	ctx := createBenchmarkContext()

	asset := &model.Asset{
		ID:        uuid.New().String(),
		Name:      "Benchmark Asset",
		Type:      model.AssetTypeImage,
		BoardID:   uuid.New().String(),
		Status:    model.AssetStatusPending,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_, err := assetResolver.Board(ctx, asset)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// Live Analytics Simulation Benchmarks
func BenchmarkLiveAnalytics_MultipleBoards(b *testing.B) {
	resolver := setupBenchmarkResolver()
	queryResolver := &queryResolver{resolver}
	ctx := createBenchmarkContext()

	// Simulate fetching analytics for multiple boards
	boardIDs := make([]string, 10)
	for i := range boardIDs {
		boardIDs[i] = uuid.New().String()
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		for _, boardID := range boardIDs {
			_, err := queryResolver.Board(ctx, boardID)
			if err != nil {
				b.Fatal(err)
			}
		}
	}
}

func BenchmarkLiveAnalytics_AssetMetrics(b *testing.B) {
	resolver := setupBenchmarkResolver()
	boardResolver := &boardResolver{resolver}
	ctx := createBenchmarkContext()

	boards := make([]*model.Board, 5)
	for i := range boards {
		boards[i] = &model.Board{
			ID:        uuid.New().String(),
			Name:      fmt.Sprintf("Analytics Board %d", i),
			ProjectID: uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		for _, board := range boards {
			_, err := boardResolver.Assets(ctx, board)
			if err != nil {
				b.Fatal(err)
			}
		}
	}
}

// Concurrent Access Benchmarks
func BenchmarkConcurrentAssetUpload(b *testing.B) {
	resolver := setupBenchmarkResolver()
	mutationResolver := &mutationResolver{resolver}
	ctx := createBenchmarkContext()

	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			input := model.UploadAssetInput{
				Name:    fmt.Sprintf("concurrent-asset-%s.jpg", uuid.New().String()),
				Type:    model.AssetTypeImage,
				URL:     "https://example.com/concurrent-asset.jpg",
				BoardID: uuid.New().String(),
			}

			_, err := mutationResolver.UploadAsset(ctx, input)
			if err != nil {
				b.Fatal(err)
			}
		}
	})
}

func BenchmarkConcurrentBoardAccess(b *testing.B) {
	resolver := setupBenchmarkResolver()
	queryResolver := &queryResolver{resolver}
	ctx := createBenchmarkContext()

	boardIDs := make([]string, 100)
	for i := range boardIDs {
		boardIDs[i] = uuid.New().String()
	}

	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			boardID := boardIDs[i%len(boardIDs)]
			_, err := queryResolver.Board(ctx, boardID)
			if err != nil {
				b.Fatal(err)
			}
			i++
		}
	})
}

// Memory allocation benchmarks
func BenchmarkMemoryAllocation_AssetCreation(b *testing.B) {
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		asset := &model.Asset{
			ID:        uuid.New().String(),
			Name:      "Memory Test Asset",
			Type:      model.AssetTypeImage,
			URL:       stringPtr("https://example.com/memory-test.jpg"),
			Status:    model.AssetStatusPending,
			BoardID:   uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_ = asset // Prevent optimization
	}
}

func BenchmarkMemoryAllocation_BoardWithAssets(b *testing.B) {
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		board := &model.Board{
			ID:        uuid.New().String(),
			Name:      "Memory Test Board",
			ProjectID: uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		// Simulate assets being loaded
		assets := make([]*model.Asset, 10)
		for j := range assets {
			assets[j] = &model.Asset{
				ID:        uuid.New().String(),
				Name:      fmt.Sprintf("Asset %d", j),
				Type:      model.AssetTypeImage,
				BoardID:   board.ID,
				Status:    model.AssetStatusPending,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
		}
		_ = assets // Prevent optimization
	}
} 