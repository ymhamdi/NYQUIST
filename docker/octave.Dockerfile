FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends octave octave-control octave-signal gnuplot-nox fonts-dejavu-core fonts-freefont-otf fontconfig xvfb xauth ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /work
