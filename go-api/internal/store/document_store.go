package store

import (
	"database/sql"
	"time"
)

type Document struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Length      int       `json:"length"`
	NumChapters int       `json:"num_chapters"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PostgresDocumentStore struct {
	db *sql.DB
}

func NewPostgresDocumentStore(db *sql.DB) *PostgresDocumentStore {
	return &PostgresDocumentStore{db: db}
}

type DocumentStore interface {
	CreateDocument(*Document, *User) (*Document, error)
	ReadDocument(string) (*Document, error)
	UpdateDocument(*Document) (*Document, error)
	DeleteDocument(*Document) error
	GetAllDocumentIds(*User) ([]*Document, error)
}

func (pg *PostgresDocumentStore) CreateDocument(document *Document, user *User) (*Document, error) {
	tx, err := pg.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
	INSERT INTO documents (user_id, title, description, length, num_chapters)
	VALUES ($1, $2, $3, $4, $5, $6)
	RETURNING id, created_at, updated_at
	`

	err = tx.QueryRow(query, user.ID, document.Title, document.Description, document.Length, document.NumChapters).Scan(&document.ID, &document.CreatedAt, &document.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Every document needs to have a default section, users can use this as the whole document or as a real section
	// which will help improve RAG accuracy
	query = `
		INSERT INTO sections (document_id, title)
		VALUES ($1, $2)
	`
	res, err := tx.Exec(query, document.ID, "New Section")
	if err != nil {
		return nil, err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}

	if rows != 1 {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return document, nil
}

func (pg *PostgresDocumentStore) ReadDocument(documentId string) (*Document, error) {
	document := &Document{}
	return document, nil
}

func (pg *PostgresDocumentStore) UpdateDocument(document *Document) (*Document, error) {
	return document, nil
}

func (pg *PostgresDocumentStore) DeleteDocument(document *Document) error {
	return nil
}

func (pg *PostgresDocumentStore) GetAllDocumentIds(user *User) ([]*Document, error) {
	documents := []*Document{}
	return documents, nil
}
