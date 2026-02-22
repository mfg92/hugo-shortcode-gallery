{{ with .enlarge }}
.jg-entry img {
    transition: transform .25s ease-in-out !important;
}

.jg-entry img:hover {
    transform: scale(1.1);
}
{{ end }}

.lazy-blur {
    filter: blur(25px);
}
