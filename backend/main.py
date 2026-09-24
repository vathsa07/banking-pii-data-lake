import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.routes.auth_routes import router as auth_router
from backend.routes.data_routes import router as data_router
from backend.routes.audit_routes import router as audit_router
from backend.routes.pipeline_routes import router as pipeline_router

app = FastAPI(
    title="Banking PII & Governance Data Lake API",
    description="FastAPI Backend providing JWT Authentication, Role-Based Access Control (RBAC), Audit Trail, and Airflow Pipeline Status",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(data_router)
app.include_router(audit_router)
app.include_router(pipeline_router)

@app.get("/")
def root():
    return {
        "system": "Banking PII Data Lake Governance API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
