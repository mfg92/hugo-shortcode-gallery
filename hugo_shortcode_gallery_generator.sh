#!/bin/sh
if [ -z "$1" ]
   #If first argument is empty set "/tmp" as working directory
then
    OUT_DIR=/tmp
else
    #Else set first argument as working directory
    OUT_DIR=`pwd`"/$1"
fi
if [ -z "$2" ]
   #If second argument is empty set "hugo" as sitename
then
    SITE=mysite
else
    #Else set second argument as sitename
    SITE=$2
fi
if [ -z "$3" ]
   #If third argument is empty set "hugo" as path
then
    HUGOPATH=hugo
else
    #Else set third argument as path
    HUGOPATH=$3
fi

echo "Check if $OUT_DIR does not exist"
if [ ! -d "$OUT_DIR" ]
then
    echo "Directory $1 DOES NOT exists. You can create it using: mkdir $1"
    exit 9999 # die with error code 9999
fi

echo "Working directory is $OUT_DIR"

echo "Sitename is $SITE"
cd $OUT_DIR

echo "Kill any running hugo server"
sudo killall --quiet --signal SIGKILL hugo

echo "Remove any remnants from previous tests by \
uncommenting this line in the script or run it manually:"
echo "sudo rm -r -f $SITE"
# sudo rm -r -f $SITE

echo "Generate a new site"
$HUGOPATH new site $SITE

echo "Get a lightweight theme"
cd $OUT_DIR/$SITE
git init
git submodule add https://github.com/de-souza/hugo-flex.git themes/hugo-flex

echo "Add the theme to the site's config"

echo 'theme = "hugo-flex"' >> config.toml

echo "Create a first post"
$HUGOPATH new posts/my-first-post.md

echo "Show what has been created"
cat ~$OUT_DIR/$SITE/content/posts/my-first-post.md

echo "Add the word 'foobar' and some others to the post"
printf '# foobar\nbar\n- lorem\n- ipsum' >> $OUT_DIR/$SITE/content/posts/my-first-post.md

echo "Start hugo server and build $SITE"
nohup $HUGOPATH server --buildDrafts &

echo "Do a test: \
Wait some time for hugo to generate the server, \
then get the website and assert it contains the word foo in it's html source \
by grepping it in the html source \
(you might have to do this manually if $SITE is cluttering your terminal"
sleep 3s

echo `curl -s http://localhost:1313/ | grep 'foobar'`

echo "Kill any running hugo server"
sudo killall --quiet --signal SIGKILL hugo

echo "Remove any remnants from previous tests by \
uncommenting this line in the script or run it manually:"
echo "sudo rm -r -f $OUT_DIR/$SITE/themes/hugo-shortcode-gallery"
# sudo rm -r -f $OUT_DIR/$SITE/themes/hugo-shortcode-gallery

echo "Cloning the hugo-shortcode-gallery git repository into $OUT_DIR/$SITE/themes."
cd $OUT_DIR/$SITE/themes
git clone https://github.com/mfg92/hugo-shortcode-gallery.git

echo "Adding this theme to $OUT_DIR/$SITE/config.toml using GNU sed"

echo `sed --debug -i 's/"hugo-flex"/\["hugo-flex", "hugo-shortcode-gallery"\]/' $OUT_DIR/$SITE/config.toml`

echo "Adding the gallery to the navigation in $OUT_DIR/$SITE/config.toml"
printf "
[[menu.nav]]
name = '"Gallery"'
url = '"gallery/"'
weight = 1
" >> $OUT_DIR/$SITE/config.toml

echo "Create the gallery and images folder"
mkdir --parents $OUT_DIR/$SITE/content/gallery/images

echo "Create the index.md in the gallery folder"
cd $OUT_DIR/$SITE
$HUGOPATH new /gallery/index.md

echo "Check content of index.md"
cat $OUT_DIR/$SITE/content/gallery/index.md

echo "Download some images into gallery/images"
cd $OUT_DIR/$SITE/content/gallery/images
wget --no-verbose https://raw.githubusercontent.com/mfg92/hugo-shortcode-gallery/example_site/example_site/content/gallery/images/2020-06-18-_MG_9066.jpg
wget --no-verbose https://raw.githubusercontent.com/mfg92/hugo-shortcode-gallery/example_site/example_site/content/gallery/images/2020-07-26-_MG_3439.jpg

echo "Adding the shortcode to index.md"
printf 'Here is an example gallery:

{{< gallery
    match="images/*"
    showExif="true"
    sortOrder="desc"
    loadJQuery="true"
    embedPreview="true"
>}}' >> $OUT_DIR/$SITE/content/gallery/index.md

echo "cd into $OUT_DIR/$SITE and build the site"
cd $OUT_DIR/$SITE
nohup $HUGOPATH server --buildDrafts &

echo "Do a test: \
Wait some time for hugo to generate the server, \
then visit the gallery and assert it contains the string 'jpg', \
by grepping it in the html source \
(you might have to do this manually if hugo is cluttering your terminal"
sleep 3s

echo `curl -s http://localhost:1313/gallery/ | grep 'jpg'`

echo "Visit http://localhost:1313/gallery/ using your default browser"
xdg-open http://localhost:1313/gallery/
