package store

import "database/sql"

type Document struct {
	ID          string `json:"id"`
	UserID      string `json:"user_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Length      int    `json:"length"`
	NumChapters int    `json:"num_chapters"`
}

type PostgresDocumentStore struct {
	db *sql.DB
}

func NewPostgresDocumentStore(db *sql.DB) *PostgresDocumentStore {
	return &PostgresDocumentStore{db: db}
}

type DocumentStore interface {
	CreateDocument(*User) (*Document, error)
	ReadDocument(documentId string) (*Document, error)
	UpdateDocument(documentId string) (*Document, error)
	DeleteDocument(documentId string) error
	GetAllDocuments(*User) ([]string, error)
}

func (p *PostgresDocumentStore) CreateDocument(user *User) (*Document, error) {

}
