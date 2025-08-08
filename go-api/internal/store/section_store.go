package store

import (
	"database/sql"
	"encoding/json"
	"time"
)

type Section struct {
	ID         string          `json:"id"`
	DocumentID string          `json:"document_id"`
	Title      string          `json:"title"`
	Content    string          `json:"content"`
	Summary    int             `json:"summary"`
	Metadata   json.RawMessage `json:"metadata"`
	Length     int             `json:"length"`
	NumWords   int             `json:"num_words"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type PostgresSectionStore struct {
	db *sql.DB
}

func NewPostgresSectionStore(db *sql.DB) *PostgresSectionStore {
	return &PostgresSectionStore{db: db}
}

type SectionStore interface {
	CreateSection(*Section, *Document) (*Section, error)
	ReadSection(string) (*Section, error)
	UpdateSection(*Section) (*Section, error)
	DeleteSection(*Section) error
	GetAllSectionIds(*User) ([]*Section, error)
}

func (p *PostgresSectionStore) CreateSection(section *Section, document *Document) (*Section, error) {
	query := `
	INSERT INTO sections (document_id, title, content, summary, metadata, length, num_words)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING id, created_at, updated_at
	`

	err := p.db.QueryRow(query, document.ID, section.Title, section.Content, section.Summary, section.Metadata, section.Length, section.NumWords).Scan(&section.ID, &section.CreatedAt, &section.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return section, nil
}

func (p *PostgresSectionStore) ReadSection(documentId string) (*Section, error) {
	section := &Section{}
	return section, nil
}

func (p *PostgresSectionStore) UpdateSection(section *Section) (*Section, error) {
	return section, nil
}

func (p *PostgresSectionStore) DeleteSection(section *Section) error {
	return nil
}

func (p *PostgresSectionStore) GetAllSectionIds(user *User) ([]*Section, error) {
	sections := []*Section{}
	return sections, nil
}
