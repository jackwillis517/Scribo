package store

import "database/sql"

type PostgresAgentStore struct {
	db *sql.DB
}

type AgentMessage struct {
	DocumentID string  `json:"document_id"`
	SectionID  string  `json:"section_id"`
	ThreadID   *string `json:"thread_id,omitempty"`
	Role       string  `json:"role"`
	Content    string  `json:"content"`
}

type AgentResponse struct {
	DocumentID string `json:"document_id"`
	ThreadID   string `json:"thread_id"`
	Role       string `json:"role"`
	Content    string `json:"content"`
}

func NewPostgresAgentStore(db *sql.DB) AgentStore {
	return &PostgresAgentStore{db: db}
}

type AgentStore interface {
	GetAgentMessagesByID(documentID string, sectionID string) ([]AgentMessage, error)
}

func (pa *PostgresAgentStore) GetAgentMessagesByID(documentID string, sectionID string) ([]AgentMessage, error) {
	query := `
		SELECT m.role, m.content, c.thread_id, c.document_id
		FROM messages m
		JOIN conversations c ON m.thread_id = c.thread_id
		WHERE c.document_id = $1 AND c.section_id = $2
		ORDER BY m.created_at ASC
	`

	rows, err := pa.db.Query(query, documentID, sectionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []AgentMessage
	for rows.Next() {
		var msg AgentMessage
		if err := rows.Scan(&msg.Role, &msg.Content, &msg.ThreadID, &msg.DocumentID); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return messages, nil
}
