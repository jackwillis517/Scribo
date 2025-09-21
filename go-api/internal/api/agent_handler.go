package api

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackwillis517/Scribo/internal/middleware"
	"github.com/jackwillis517/Scribo/internal/utils"
)

type AgentHandler struct {
	logger *log.Logger
}

type AgentMessage struct {
	DocumentID string  `json:"document_id"`
	Message    string  `json:"message"`
	ThreadID   *string `json:"thread_id,omitempty"`
}

type AgentResponse struct {
	ThreadID string `json:"thread_id"`
	Answer   string `json:"answer"`
}

func NewAgentHandler(logger *log.Logger) *AgentHandler {
	return &AgentHandler{logger: logger}
}

func (ah *AgentHandler) HandleAgentMessage(w http.ResponseWriter, r *http.Request) {
	var req AgentMessage
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		ah.logger.Printf("ERROR: decodingAgentMessage: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	payload, err := json.Marshal(req)
	if err != nil {
		utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"error": "marshal error"})
		return
	}

	flaskResp, err := http.Post("http://localhost:5001/message", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"error": "flask api request failed"})
		return
	}
	defer flaskResp.Body.Close()

	var flaskResult AgentResponse
	if err := json.NewDecoder(flaskResp.Body).Decode(&flaskResult); err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "flask response decode error"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"response": flaskResult})
}
