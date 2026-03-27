PORT     ?= 3001
PID_DIR  := .pids

.PHONY: start stop clean

start:
	@mkdir -p $(PID_DIR)
	@echo "Starting API server on :$(PORT)..."
	@OPENROUTER_API_KEY=$(OPENROUTER_API_KEY) PORT=$(PORT) \
		npx tsx src/server.local.ts & echo $$! > $(PID_DIR)/backend.pid
	@echo "Starting frontend..."
	@npx vite & echo $$! > $(PID_DIR)/frontend.pid
	@echo ""
	@echo "  Frontend : http://localhost:5173"
	@echo "  API      : http://localhost:$(PORT)"
	@echo ""
	@echo "Run 'make stop' to shut down."

stop:
	@if [ -f $(PID_DIR)/backend.pid ]; then \
		kill $$(cat $(PID_DIR)/backend.pid) 2>/dev/null && echo "API server stopped."; \
		rm -f $(PID_DIR)/backend.pid; \
	fi
	@if [ -f $(PID_DIR)/frontend.pid ]; then \
		kill $$(cat $(PID_DIR)/frontend.pid) 2>/dev/null && echo "Frontend stopped."; \
		rm -f $(PID_DIR)/frontend.pid; \
	fi

clean:
	@rm -rf dist $(PID_DIR)
	@echo "Cleaned."
