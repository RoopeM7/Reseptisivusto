ALTER TABLE system_user 
ADD COLUMN ´password´ VARCHAR(100) NULL;

update system_user
SET password = '$2b$10$J/o4uA5MGT.D8ji6/t74P.tSUb9ReQUcCNofVIKTWneg1Z0hLi.OS'
WHERE id = 1;
-- muistiin muistiin panoja :D
update system_user
SET password = '$2b$10$P45pnbelh1J1ObGxMeP1s..vG7sxWwjQt/ebcLMMF1wZh6Av7hBJG'
WHERE id = 2;