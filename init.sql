-- создание пользователя "developer" если его нет
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'devuser') THEN
    CREATE USER devuser WITH PASSWORD 'devuser';
  END IF;
END $$;

-- --------------------------------------------------------------------------------*
--                                                                                 |
--                                                                                 |
--    Создание базы данных auth_service_database, если её нет, и ее заполнение     |
--                                                                                 |
--                                                                                 |
-- --------------------------------------------------------------------------------* 

CREATE DATABASE auth_service_database;

-- предоставление прав пользователю на базу данных
GRANT ALL PRIVILEGES ON DATABASE auth_service_database TO devuser;

\c auth_service_database;

-- создание таблицы users
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  token VARCHAR(255) NULL,
  surname VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  patronymic VARCHAR(255) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  is_email_address_verified BOOLEAN,
  phone_number VARCHAR(11) NOT NULL,
  is_phone_number_verified BOOLEAN,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN,
  deactivated_at TIMESTAMP
);

-- Вставка данных для пользователей в таблицу users
INSERT INTO users (surname, name, patronymic, email_address, is_email_address_verified, phone_number, is_phone_number_verified, password, is_active)
VALUES
  ('Иванов', 'Иван', 'Иванович', 'ivan.ivanov@example.com', true, '79123456789', true, 'password123', true),
  ('Петров', 'Петр', 'Петрович', 'petr.petrov@example.com', true, '79234567890', true, 'securepass456', false),
  ('Сидоров', 'Сидор', 'Сидорович', 'sidor.sidorov@example.com', true, '79345678901', true, 'strongpass789', true);

-- таблица user_role
CREATE TABLE user_role (
  code VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Вставка данных для ролей пользователей в таблицу user_role
INSERT INTO user_role (code, name) VALUES
  ('admin', 'Администратор системы'),
  ('service', 'Сервис'),
  ('user', 'Пользователь системы');

-- Создание промежуточной таблицы user_role_assignment для связи многие-ко-многим
CREATE TABLE user_role_assignment (
  assignment_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  role_code VARCHAR(255) REFERENCES user_role(code),
  UNIQUE (user_id, role_code)
);

INSERT INTO user_role_assignment (user_id, role_code) VALUES (1, 'admin');
INSERT INTO user_role_assignment (user_id, role_code) VALUES (2, 'user');
INSERT INTO user_role_assignment (user_id, role_code) VALUES (3, 'user');
INSERT INTO user_role_assignment (user_id, role_code) VALUES (1, 'user');



-- ----------------------------------------------------------------------------------------*
--                                                                                         |
--                                                                                         |
--    Создание базы данных notification_service_database, если её нет, и ее заполнение     |
--                                                                                         |
--                                                                                         |
-- ----------------------------------------------------------------------------------------* 

CREATE DATABASE notification_service_database;

-- предоставление прав пользователю на базу данных
GRANT ALL PRIVILEGES ON DATABASE notification_service_database TO devuser;

\c notification_service_database;

-- создание таблицы category
CREATE TABLE category (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
comment on column category.id is 'The category ID';
comment on column category.name is 'Category name';

-- создание таблицы section_link
CREATE TABLE section_link (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  link VARCHAR(255) NOT NULL
);
comment on column section_link.id is 'The section_link ID';
comment on column section_link.name is 'Section_link name';
comment on column section_link.link is 'Section_link link';

-- создание таблицы type
CREATE TABLE type (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
comment on column type.id is 'The type ID';
comment on column type.name is 'Type name';

-- создание таблицы notification
CREATE TABLE notification (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL,
  type_id INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  section_link_id INT NOT NULL,
  file_id INT[],
  FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE CASCADE,
  FOREIGN KEY (type_id) REFERENCES type (id) ON DELETE CASCADE,
  FOREIGN KEY (section_link_id) REFERENCES section_link (id) ON DELETE SET NULL
);

-- создание таблицы file
CREATE TABLE file (
  id SERIAL PRIMARY KEY,
  format VARCHAR(255) NOT NULL,
  size INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL
);
comment on column file.id is 'The file ID';
comment on column file.format is 'File format';
comment on column file.size is 'File size';
comment on column file.name is 'File name';
comment on column file.path is 'File path';

-- создание таблицы method
CREATE TABLE method (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- создание таблицы user
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  surname VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  patronymic VARCHAR(255) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255) NOT NULL,
  fcm_token VARCHAR(255) NOT NULL,
  hms_token VARCHAR(255) NOT NULL
);
-- Вставка данных для пользователей в таблицу users
INSERT INTO users (surname, name, patronymic, email_address, phone_number, fcm_token, hms_token)
VALUES
  ('Иванов', 'Иван', 'Иванович', 'ivan.ivanov@example.com', '79123456789', 'token1', "true"),
  ('Петров', 'Петр', 'Петрович', 'petr.petrov@example.com', '79234567890', 'token2', "false"),
  ('Сидоров', 'Сидор', 'Сидорович', 'sidor.sidorov@example.com', '79345678901', 'token3', "true");

-- создание таблицы initiator
CREATE TABLE initiator (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- создание таблицы status
CREATE TABLE status (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- создание таблицы task
CREATE TABLE task (
  id SERIAL PRIMARY KEY,
  notification_id INT NOT NULL,
  date TIMESTAMP NOT NULL,
  status_id INT NOT NULL,
  status_updated_at TIMESTAMP NOT NULL,
  method_id INT NOT NULL,
  user_id INT NOT NULL,
  initiator_id INT NOT NULL,
  FOREIGN KEY (notification_id) REFERENCES notification (id) ON DELETE CASCADE,
  FOREIGN KEY (status_id) REFERENCES status (id) ON DELETE SET NULL,
  FOREIGN KEY (method_id) REFERENCES method (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (initiator_id) REFERENCES initiator (id) ON DELETE CASCADE
);