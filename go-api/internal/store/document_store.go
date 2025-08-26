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
	NumWords    int       `json:"num_words"`
	NumSections int       `json:"num_sections"`
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
	DeleteDocument(string) error
	GetAllDocuments(*User) ([]*Document, error)
}

func (pg *PostgresDocumentStore) CreateDocument(document *Document, user *User) (*Document, error) {
	tx, err := pg.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
	INSERT INTO documents (user_id, title, description, length, num_words, num_sections)
	VALUES ($1, $2, $3, $4, $5, $6)
	RETURNING id, created_at, updated_at
	`

	err = tx.QueryRow(query, user.ID, document.Title, document.Description, document.Length, document.NumWords, document.NumSections).Scan(&document.ID, &document.CreatedAt, &document.UpdatedAt)
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
	query := `
		SELECT id, user_id, title, description, length, num_words, num_sections, created_at, updated_at
		FROM documents
		WHERE id = $1
	`
	err := pg.db.QueryRow(query, documentId).Scan(
		&document.ID,
		&document.UserID,
		&document.Title,
		&document.Description,
		&document.Length,
		&document.NumWords,
		&document.NumSections,
		&document.CreatedAt,
		&document.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return document, nil
}

func (pg *PostgresDocumentStore) UpdateDocument(document *Document) (*Document, error) {
	query := `
		UPDATE documents
		SET title = $1, description = $2, length = $3, num_words = $4, num_sections = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at
	`
	err := pg.db.QueryRow(query,
		document.Title,
		document.Description,
		document.Length,
		document.NumWords,
		document.NumSections,
		document.ID,
	).Scan(&document.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return document, nil
}

func (pg *PostgresDocumentStore) DeleteDocument(documentId string) error {
	query := `DELETE FROM documents WHERE id = $1`
	_, err := pg.db.Exec(query, documentId)
	if err != nil {
		return err
	}
	return nil
}

func (pg *PostgresDocumentStore) GetAllDocuments(user *User) ([]*Document, error) {
	query := `
		SELECT id, user_id, title, description, length, num_chapters, created_at, updated_at
		FROM documents
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := pg.db.Query(query, user.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	documents := []*Document{}
	for rows.Next() {
		doc := &Document{}
		err := rows.Scan(
			&doc.ID,
			&doc.UserID,
			&doc.Title,
			&doc.Description,
			&doc.Length,
			&doc.NumWords,
			&doc.NumSections,
			&doc.CreatedAt,
			&doc.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, doc)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return documents, nil
}
