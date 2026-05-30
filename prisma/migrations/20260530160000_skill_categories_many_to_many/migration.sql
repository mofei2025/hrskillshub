-- 创建隐式多对多关联表
CREATE TABLE "_CategoryToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- 从现有 categoryId 迁移数据
INSERT INTO "_CategoryToSkill" ("A", "B")
SELECT "categoryId", "id" FROM "Skill" WHERE "categoryId" IS NOT NULL;

-- 添加外键约束
ALTER TABLE "_CategoryToSkill" ADD CONSTRAINT "_CategoryToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CategoryToSkill" ADD CONSTRAINT "_CategoryToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加唯一索引和普通索引（Prisma 隐式多对多必须）
CREATE UNIQUE INDEX "_CategoryToSkill_AB_unique" ON "_CategoryToSkill"("A" ASC, "B" ASC);
CREATE INDEX "_CategoryToSkill_B_index" ON "_CategoryToSkill"("B");

-- 删除旧的单外键列
ALTER TABLE "Skill" DROP COLUMN "categoryId";
