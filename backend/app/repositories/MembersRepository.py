from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.members import Member


class MembersRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_members(self) -> list[Member]:
        return (
            self.db.query(Member)
            .order_by(Member.order_index.asc(), Member.full_name.asc())
            .all()
        )

    def get_member(self, member_id: int) -> Member | None:
        return self.db.get(Member, member_id)

    def create_member(
        self,
        *,
        full_name: str,
        role: str | None,
        bio: str | None,
        order_index: int,
        photo_url: str | None,
    ) -> Member:
        member = Member(
            full_name=full_name,
            role=role,
            bio=bio,
            order_index=order_index,
            photo_url=photo_url,
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    def update_member(
        self,
        member_id: int,
        *,
        full_name: str,
        role: str | None,
        bio: str | None,
        order_index: int,
        photo_url: str | None,
    ) -> Member:
        member = self.db.get(Member, member_id)
        if not member:
            raise LookupError("Member not found.")

        member.full_name = full_name
        member.role = role
        member.bio = bio
        member.order_index = order_index
        member.photo_url = photo_url

        self.db.commit()
        self.db.refresh(member)
        return member

    def delete_member(self, member_id: int) -> None:
        member = self.db.get(Member, member_id)
        if not member:
            raise LookupError("Member not found.")
        self.db.delete(member)
        self.db.commit()

    def count(self) -> int:
        return self.db.query(Member).count()
