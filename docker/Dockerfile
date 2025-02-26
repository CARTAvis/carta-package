FROM ubuntu:24.04

# Install the basic packages
RUN \
    apt-get update && \
    apt-get -y upgrade && \
    DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --no-install-suggests --no-install-recommends software-properties-common && \
    apt-add-repository -y -s ppa:kernsuite/kern-7 && \
    add-apt-repository -y ppa:cartavis-team/carta && \
    apt-get -y install carta casacore-data && \
    apt-get -y remove --auto-remove software-properties-common && \
    apt-get -y clean

# Set up initial images directory and initial preferences
RUN mkdir -p /images && \
    mkdir -p /home/cartauser/.carta/config && \
    echo '{"telemetryConsentShown": true, "telemetryMode":"none"}' > /home/cartauser/.carta/config/preferences.json

# Set up a non-root user
RUN \
    groupadd -g 1001 cartauser && \
    useradd -r -u 1001 -g cartauser cartauser && \
    chown -R cartauser:cartauser /home/cartauser/.carta

# Forward port so that the webapp can properly access it from outside of the container
EXPOSE 3002

ENV CARTA_DOCKER_DEPLOYMENT=1
USER cartauser
WORKDIR /home/cartauser

ENTRYPOINT ["/usr/bin/carta_backend", "--no_browser", "--top_level_folder", "/images", "/images"]
CMD ["$@"]