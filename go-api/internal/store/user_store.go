package store

import "database/sql"

type User struct {
	ID       string `json:"id"`
	GoogleID string `json:"google_id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Picture  string `json:"picture"`
}

type PostgresUserStore struct {
	db *sql.DB
}

func NewPostgresUserStore(db *sql.DB) *PostgresUserStore {
	return &PostgresUserStore{db: db}
}

type UserStore interface {
	CreateUser(*User) (*User, error)
	FindUserByGoogleID(*User) (*User, error)
	GetUserByID(string) (*User, error)
}

func (p *PostgresUserStore) CreateUser(user *User) (*User, error) {
	row := p.db.QueryRow(`INSERT INTO users (google_id, email, name, picture) VALUES ($1, $2, $3, $4) RETURNING id, google_id, email, name, picture`, user.GoogleID, user.Email, user.Name, user.Picture)
	err := row.Scan(&user.ID, &user.GoogleID, &user.Name, &user.Email, &user.Picture)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (p *PostgresUserStore) FindUserByGoogleID(user *User) (*User, error) {
	row := p.db.QueryRow(`SELECT id, google_id, email, name FROM users WHERE google_id = $1`, user.GoogleID)
	err := row.Scan(&user.ID, &user.GoogleID, &user.Email, &user.Name)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (p *PostgresUserStore) GetUserByID(id string) (*User, error) {
	user := &User{}
	row := p.db.QueryRow(`SELECT id, google_id, email, name, picture FROM users WHERE id = $1`, id)
	err := row.Scan(&user.ID, &user.GoogleID, &user.Email, &user.Name, &user.Picture)

	if err != nil {
		return nil, err
	}

	return user, nil
}
