for f in `grep -r -l cobweb.js`;
do echo sed -i "'s/cobweb.js/cobweb.js/'" $f;
   sed -i 's/cobweb.js/cobweb.js/' $f;
done;
for f in `grep -r -l cobweb.js`;
do echo sed -i "'s/cobweb.js/cobweb.js/'" $f;
   sed -i 's/cobweb.js/cobweb.js/' $f;
done;
for f in `grep -r -l master/dist`;
do echo sed -i "'s=master/dist=master/dist='" $f;
   sed -i 's=master/dist=master/dist=' $f;
done;
grep -r create3000
