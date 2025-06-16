# Repository overview

This is [CARTA](https://cartavis.org) running in an Ubuntu 24.04 based Docker container.

The simplest way to run it is as follows:

```
docker run --rm -ti -p 3002:3002 -v $HOME/.carta:/home/cartauser/.carta -v $PWD:/images cartavis/carta
```
CARTA will automatically start using the container path **/images** in its file browser.  The **-v $PWD:/images** Docker flag maps your current local directory, **$PWD**, to the container path **/images**. Alternatively, you could use a specific path other than **$PWD**. For example, **-v /data/image-cubes:/images**.

For persistent preferences and log files, you should mount your local **~/.carta** (or **~/.carta-beta** for beta versions) directory to the **/home/cartauser/.carta** (or **/home/cartauser/.carta-beta** for beta versions) container path. For example, **-v $HOME/.carta:/home/cartauser/.carta**.

Port 3002 is the first default port used by CARTA so the **-p 3002:3002** Docker flag opens and maps port 3002 inside the container to port 3002 on the Docker host system.

A unique URL will be displayed in the terminal. Copy & Paste the unique URL into your local web browser to gain access to the CARTA frontend interface.

Any additional CARTA flags can be appended to the command. For example, to view the 'help' output:
```
docker run --rm -ti -p 3002:3002  -v $HOME/.carta:/home/cartauser/.carta -v $PWD:/images cartavis/carta --help
```

For more information about CARTA, please refer to the [CARTA user manual](https://carta.readthedocs.io/en/latest/).