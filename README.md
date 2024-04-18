# Simple authorisation on NodeJS using [Molecular](https://moleculer.services/index.html) framework

> Simple project of authorisation with JWT technology

### Technology Stack:
- JavaScript (Molecular)
- **DBMS** - Postgres
- **Application deployment** - Docker, Docker-compose
- **Cache** - Redis
- **Transporting** - RabbitMQ 
- **Monitoring** - Grafana

### Requirements
1) git installed
2) Docker installed (good manual for Ubuntu [here](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-20-04))
2) Node installed (**P.S.** later will fix *dockerfile*, there will add command *npm i*)

### Start using:

Clone this project
```console
git clone https://github.com/mant1ssa/auth_module.git
```

Install all dependences
```console
npm i
```

Launch project:
```console
docker compose up --build
```
or in detached mode
```console
docker compose build
docker compose up -d
```