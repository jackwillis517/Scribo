package api

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackwillis517/Scribo/internal/middleware"
	"github.com/jackwillis517/Scribo/internal/store"
	"github.com/jackwillis517/Scribo/internal/utils"
)

type AgentHandler struct {
	agentStore store.AgentStore
	logger     *log.Logger
}

type MessageRequest struct {
	DocumentID string `json:"document_id"`
	SectionID  string `json:"section_id"`
}

func NewAgentHandler(agentStore store.AgentStore, logger *log.Logger) *AgentHandler {
	return &AgentHandler{
		agentStore: agentStore,
		logger:     logger,
	}
}

func (ah *AgentHandler) HandleAgentMessage(w http.ResponseWriter, r *http.Request) {
	var req store.AgentMessage
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		ah.logger.Printf("ERROR: decodingAgentMessage: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	ah.logger.Printf("=== Received AgentMessage ===")
	ah.logger.Printf("DocumentID: %s", req.DocumentID)
	ah.logger.Printf("SectionID: %s", req.SectionID)
	ah.logger.Printf("ThreadID: %v", req.ThreadID)
	ah.logger.Printf("Role: %s", req.Role)
	ah.logger.Printf("Content: %s", req.Content)

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

	ah.logger.Printf("=== Sending to Flask ===")
	ah.logger.Printf("Payload: %s", string(payload))

	flaskResp, err := http.Post("http://localhost:5001/message", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"error": "flask api request failed"})
		return
	}
	defer flaskResp.Body.Close()

	var flaskResult store.AgentMessage
	if err := json.NewDecoder(flaskResp.Body).Decode(&flaskResult); err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "flask response decode error"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"response": flaskResult})
}

func (ah *AgentHandler) HandleGetMessagesById(w http.ResponseWriter, r *http.Request) {
	var req MessageRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		ah.logger.Printf("ERROR: decodingGetMessagesById: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	messages, err := ah.agentStore.GetAgentMessagesByID(req.DocumentID, req.SectionID)
	if err != nil {
		ah.logger.Printf("ERROR: getAgentMessagesByID: %v", err)
		utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"error": "failed to get messages"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"messages": messages})
}
