build:
	cd home && npm run build
	nssm restart home

dev:
	cd home && npm run dev

app-dev:
	cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8081