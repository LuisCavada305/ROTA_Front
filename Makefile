SHELL := /bin/bash

.PHONY: frontend-dev frontend-build backend-dev backend-test

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

backend-dev:
	cd backend && make run

backend-test:
	cd backend && make test
