package store

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

type Section struct {
	ID         string           `json:"id"`
	DocumentID string           `json:"document_id"`
	Title      string           `json:"title"`
	Content    string           `json:"content"`
	Summary    string           `json:"summary"`
	Metadata   *json.RawMessage `json:"metadata"`
	Length     int              `json:"length"`
	NumWords   int              `json:"num_words"`
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`
}

type PostgresSectionStore struct {
	db *sql.DB
}

func NewPostgresSectionStore(db *sql.DB) *PostgresSectionStore {
	return &PostgresSectionStore{db: db}
}

type SectionStore interface {
	CreateSection(*Section) (*Section, error)
	ReadSection(string) (*Section, error)
	UpdateSection(*Section) (*Section, error)
	DeleteSection(string) error
	GetAllSections(*User) ([]*Section, error)
}

func (p *PostgresSectionStore) CreateSection(section *Section) (*Section, error) {
	query := `
	INSERT INTO sections (document_id, title, content, summary, metadata, length, num_words)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	RETURNING id, created_at, updated_at
	`

	err := p.db.QueryRow(query, section.DocumentID, section.Title, section.Content, section.Summary, section.Metadata, section.Length, section.NumWords).Scan(&section.ID, &section.CreatedAt, &section.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return section, nil
}

func (p *PostgresSectionStore) ReadSection(sectionId string) (*Section, error) {
	section := &Section{}
	query := `
		SELECT id, document_id, title, content, summary, metadata, length, num_words, created_at, updated_at
		FROM sections
		WHERE id = $1
	`
	err := p.db.QueryRow(query, sectionId).Scan(
		&section.ID,
		&section.DocumentID,
		&section.Title,
		&section.Content,
		&section.Summary,
		&section.Metadata,
		&section.Length,
		&section.NumWords,
		&section.CreatedAt,
		&section.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return section, nil
}

func (p *PostgresSectionStore) UpdateSection(section *Section) (*Section, error) {
	query := `
		UPDATE sections
		SET title = $1, content = $2, summary = $3, metadata = $4, length = $5, num_words = $6, updated_at = NOW()
		WHERE id = $7
		RETURNING updated_at
	`
	err := p.db.QueryRow(query,
		section.Title,
		section.Content,
		section.Summary,
		section.Metadata,
		section.Length,
		section.NumWords,
		section.ID,
	).Scan(&section.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return section, nil
}

func (p *PostgresSectionStore) DeleteSection(sectionId string) error {
	query := `DELETE FROM sections WHERE id = $1`
	_, err := p.db.Exec(query, sectionId)
	if err != nil {
		return err
	}
	return nil
}

func (p *PostgresSectionStore) GetAllSections(user *User) ([]*Section, error) {
	query := `
		SELECT s.id, s.document_id, s.title, s.content, s.summary, s.metadata, s.length, s.num_words, s.created_at, s.updated_at
		FROM sections s
		INNER JOIN documents d ON s.document_id = d.id
		WHERE d.user_id = $1
		ORDER BY s.created_at DESC
	`
	rows, err := p.db.Query(query, user.ID)
	if err != nil {
		fmt.Printf("Line 120 error: %v", err)
		return nil, err
	}
	defer rows.Close()

	sections := []*Section{}
	for rows.Next() {
		section := &Section{}
		err := rows.Scan(
			&section.ID,
			&section.DocumentID,
			&section.Title,
			&section.Content,
			&section.Summary,
			&section.Metadata,
			&section.Length,
			&section.NumWords,
			&section.CreatedAt,
			&section.UpdatedAt,
		)
		if err != nil {
			fmt.Printf("Line 141 error: %v", err)
			return nil, err
		}
		sections = append(sections, section)
	}
	if err := rows.Err(); err != nil {
		fmt.Printf("Line 147 error: %v", err)
		return nil, err
	}
	return sections, nil
}
