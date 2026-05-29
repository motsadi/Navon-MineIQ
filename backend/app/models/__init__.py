"""Domain models package.

Reserved for future persistence models (e.g. SQLAlchemy / SQLModel ORM classes)
when PostgreSQL / TimescaleDB is introduced. The prototype currently serves data
from static files via ``app.data_loader`` and the ``app.services`` layer, so the
API contract can remain unchanged when a database is added behind it.
"""
