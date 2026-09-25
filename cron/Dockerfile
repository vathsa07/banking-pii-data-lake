FROM postgres:15-alpine

RUN apk add --no-cache bash curl tzdata

WORKDIR /app

COPY crontab /etc/crontabs/root
COPY scripts /scripts
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /scripts/*.sh /entrypoint.sh && chmod 0600 /etc/crontabs/root

VOLUME ["/backups", "/var/log"]

ENTRYPOINT ["/entrypoint.sh"]
