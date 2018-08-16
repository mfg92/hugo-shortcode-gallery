# hugo-shortcode-gallery

This is a theme component for hugo. To read about hugos theme components and
how to use them have a look at https://gohugo.io/themes/theme-components/.

This component contains a shortcode to include a gallery in your .md files.

Here is an usage example:

```
{{< gallery match="images/*" rowHeight="150" resizeOptions="x300 q90 Lanczos" >}}
```

This will generate a gallery containing all images of the folder *images*.
The folder must be next to the .md file where this gallery is used in.

The component requieres jQuery (3.+). Your hugo theme or youself must provide this.

The component uses [Justified Gallery](http://miromannino.github.io/Justified-Gallery/)
to render the images between the text and [Swipebox](http://brutaldesign.github.io/swipebox/)
to show them fullscreen. Also jquery-migrate-1.4 is used to let Swipebox work
with newer jQuery versions.
