srpm:
	curl --disable-epsv -L ftp://ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar -o WSRT_Measures.ztar
	mkdir -p SOURCES
	cp WSRT_Measures.ztar SOURCES/
	rpmbuild -bs --define "_sourcedir $(PWD)/SOURCES" --define "_srcrpmdir $(outdir)" measures-data.spec
