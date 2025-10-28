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
        photo_path: str | None,
    ) -> Member:
        member = Member(
            full_name=full_name,
            role=role,
            bio=bio,
            order_index=order_index,
            photo_path=photo_path,
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
        photo_path: str | None,
    ) -> tuple[Member, str | None]:
        member = self.db.get(Member, member_id)
        if not member:
            raise LookupError("Member not found.")

        previous_path = member.photo_path
        member.full_name = full_name
        member.role = role
        member.bio = bio
        member.order_index = order_index
        member.photo_path = photo_path

        self.db.commit()
        self.db.refresh(member)
        removed_path = (
            previous_path if previous_path and previous_path != member.photo_path else None
        )
        return member, removed_path

    def delete_member(self, member_id: int) -> str | None:
        member = self.db.get(Member, member_id)
        if not member:
            raise LookupError("Member not found.")
        photo_path = member.photo_path
        self.db.delete(member)
        self.db.commit()
        return photo_path

    def count(self) -> int:
        return self.db.query(Member).count()
