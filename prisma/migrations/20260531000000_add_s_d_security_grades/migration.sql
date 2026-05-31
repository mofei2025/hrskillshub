-- 添加 S 和 D 到 SecurityGrade 枚举
-- PostgreSQL 不支持直接删除枚举值，但可以添加新值
ALTER TYPE "SecurityGrade" ADD VALUE IF NOT EXISTS 'S';
ALTER TYPE "SecurityGrade" ADD VALUE IF NOT EXISTS 'D';

-- 迁移现有数据：原来的命名是错误的（A实际显示为S级、B显示为A级、C显示为B级）
-- 按顺序执行避免冲突：先把 A 改成 S（新增的值），再把 B 改成 A，最后把 C 改成 B
UPDATE "Skill" SET "securityGrade" = 'S'::"SecurityGrade" WHERE "securityGrade" = 'A'::"SecurityGrade";
UPDATE "Skill" SET "securityGrade" = 'A'::"SecurityGrade" WHERE "securityGrade" = 'B'::"SecurityGrade";
UPDATE "Skill" SET "securityGrade" = 'B'::"SecurityGrade" WHERE "securityGrade" = 'C'::"SecurityGrade";
