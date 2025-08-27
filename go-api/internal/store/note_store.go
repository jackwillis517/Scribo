package store

import (
	"database/sql"
	"time"
)

type Note struct {
	ID        string    `json:"id"`
	SectionID string    `json:"section_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PostgresNoteStore struct {
	db *sql.DB
}

func NewPostgresNoteStore(db *sql.DB) *PostgresNoteStore {
	return &PostgresNoteStore{db: db}
}

type NoteStore interface {
	CreateNote(*Note) (*Note, error)
	ReadNote(string) (*Note, error)
	UpdateNote(*Note) (*Note, error)
	DeleteNote(string) error
	GetAllNotes(*User) ([]*Note, error)
}

func (p *PostgresNoteStore) CreateNote(note *Note) (*Note, error) {
	query := `
	INSERT INTO notes (section_id, content)
	VALUES ($1, $2)
	RETURNING id, created_at, updated_at
	`

	err := p.db.QueryRow(query, note.SectionID, note.Content).Scan(&note.ID, &note.CreatedAt, &note.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return note, nil
}

func (p *PostgresNoteStore) ReadNote(noteId string) (*Note, error) {
	note := &Note{}
	query := `
		SELECT id, section_id, content, created_at, updated_at
		FROM notes
		WHERE id = $1
	`
	err := p.db.QueryRow(query, noteId).Scan(
		&note.ID,
		&note.SectionID,
		&note.Content,
		&note.CreatedAt,
		&note.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return note, nil
}

func (p *PostgresNoteStore) UpdateNote(note *Note) (*Note, error) {
	query := `
		UPDATE notes
		SET content = $2, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`
	err := p.db.QueryRow(query,
		note.ID,
		note.Content,
	).Scan(&note.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return note, nil
}

func (p *PostgresNoteStore) DeleteNote(noteId string) error {
	query := `DELETE FROM notes WHERE id = $1`
	_, err := p.db.Exec(query, noteId)
	if err != nil {
		return err
	}
	return nil
}

func (p *PostgresNoteStore) GetAllNotes(user *User) ([]*Note, error) {
	query := `
		SELECT n.id, n.section_id, n.content, n.created_at, n.updated_at
		FROM notes n
		INNER JOIN sections s ON n.section_id = s.id
		INNER JOIN documents d ON s.document_id = d.id
		WHERE d.user_id = $1
		ORDER BY n.created_at DESC
	`
	rows, err := p.db.Query(query, user.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notes := []*Note{}
	for rows.Next() {
		note := &Note{}
		err := rows.Scan(
			&note.ID,
			&note.SectionID,
			&note.Content,
			&note.CreatedAt,
			&note.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return notes, nil
}
