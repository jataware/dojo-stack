SHELL = /bin/bash
LANG = en_US.utf-8
PYTHON = $(shell which python3 || which python)
DOCKER = $(shell which docker)
DOCKER_COMPOSE = $(shell which docker-compose || echo "$(DOCKER) compose")
export LANG

BASEDIR = $(shell pwd)
CLOUSEAU_DIR = clouseau
DOJO_API_DIR = api
DOJO_DMC_DIR = dmc
MIXMASTA_DIR = mixmasta
PHANTOM_DIR = phantom
RQ_DIR = tasks
WORKERS_DIR = workers
COMPOSE_DIRS := $(CLOUSEAU_DIR) $(DOJO_API_DIR) $(DOJO_DMC_DIR) $(WORKERS_DIR)
COMPOSE_FILES := $(CLOUSEAU_DIR)/docker-compose.yaml $(DOJO_API_DIR)/docker-compose.yaml \
				 $(DOJO_DMC_DIR)/docker-compose.yaml $(WORKERS_DIR)/docker-compose.yaml \
				 $(RQ_DIR)/docker-compose.yaml
TEMP_COMPOSE_FILES := $(foreach file,$(subst /,_,$(COMPOSE_FILES)),temp_$(file))

.PHONY:test
test:
	$(info $(DOCKER))
	$(info $(DOCKER_COMPOSE))
	$(DOCKER) version
	$(DOCKER_COMPOSE) version

.PHONY:update
update:
	git fetch; \
	git submodule foreach git pull; \
	git submodule foreach git status; \
	$(PYTHON) $(BASEDIR)/bin/update_envfile.py envfile.sample envfile;

.PHONY:init
init:
	git submodule update --init --remote --rebase; \
	git config --add fetch.recursesubmodules true; \
	git submodule foreach 'git checkout $$(git config -f ../.gitmodules --get "submodule.$$name.branch")'; \
	mkdir -p -m 0777 $(DOJO_DMC_DIR)/logs $(DOJO_DMC_DIR)/configs $(DOJO_DMC_DIR)/plugins $(DOJO_DMC_DIR)/model_configs \
		$(DOJO_DMC_DIR)/dojo; \
	touch clouseau/.dockerenv; \
	make envfile;

.PHONY:rebuild-all
rebuild-all:
	$(DOCKER_COMPOSE) build --no-cache; \
	cd $(MIXMASTA_DIR) && $(DOCKER) build . -t mixmasta:dev;

envfile:
ifeq ($(wildcard envfile),)
	cp envfile.sample envfile; \
	echo -e "\nDon't forget to update 'envfile' with all your secrets!";
endif


.PHONY:clean
clean:
	echo "Clearing all transient data" && \
	$(DOCKER) image prune -f && \
	$(DOCKER) container prune -f && \
	$(DOCKER_COMPOSE) run app rm -r ./data/*/ && \
	echo "Done"

clouseau/.dockerenv:
	touch clouseau/.dockerenv

docker-compose.yaml:$(COMPOSE_FILES) docker-compose.build-override.yaml clouseau/.dockerenv envfile
	export $$(cat envfile | xargs); \
	export AWS_SECRET_ACCESS_KEY_ENCODED=$$(echo -n $${AWS_SECRET_ACCESS_KEY} | \
		curl -Gso /dev/null -w %{url_effective} --data-urlencode @- "" | cut -c 3-); \
	if [[ -z  "$${DOCKERHUB_AUTH}" ]]; then \
		export DOCKERHUB_AUTH="$$(echo '{"username":"'$${DOCKERHUB_USER}'","password":"'$${DOCKERHUB_PWD}'","email":"'$${DOCKERHUB_EMAIL}'"}' | base64 | tr -d '\n')"; \
	fi; \
	for compose_file in $(COMPOSE_FILES); do \
	  	tempfile="temp_$${compose_file//\//_}"; \
  		$(DOCKER_COMPOSE) -f $$compose_file config > $$tempfile; \
  	done; \
	sed -E -i'.sedbkp' -f .dmc.sed temp_dmc_docker-compose.yaml; \
	$(DOCKER_COMPOSE) --env-file envfile $(foreach f,$(TEMP_COMPOSE_FILES), -f $(f)) \
	  	-f docker-compose.build-override.yaml config > docker-compose.yaml; \
	rm $(TEMP_COMPOSE_FILES) *.sedbkp;


phantom/ui/node_modules:docker-compose.yaml phantom/ui/package-lock.json phantom/ui/package.json
	$(DOCKER_COMPOSE) run phantom npm ci -y


.PHONY:up
up:docker-compose.yaml phantom/ui/node_modules
	$(DOCKER_COMPOSE) up -d

.PHONY:up-rebuild
up-rebuild:docker-compose.yaml phantom/ui/node_modules
	$(DOCKER_COMPOSE) up --build -d



.PHONY:down
down:docker-compose.yaml
	$(DOCKER_COMPOSE) down


.PHONY:restart
restart:docker-compose.yaml
	make down && make up


.PHONY:logs
logs:
	$(DOCKER_COMPOSE) logs -f --tail=30
