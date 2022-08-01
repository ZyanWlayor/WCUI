# WCUI-Starter

This is starter skeleton for use *prue javascript* and *web component* for developing single or multiple pages web page.

- not single page router provided,you need to realization it yourself.
- provide a certain number of web components to help accelerate development.

## Usage
```
git clone git@repository your-project-name

yarn

yarn global add gulp

gulp dev                    // for development

gulp build                  // for build release
```

*ensure you have install windows build tools correctly,when install nodejs,and access to raw.githubusercontent.com*

*enable proxy and set proxy env to your shell,to get binary of image precessor successfully eg:*

```
// powershell
$env:all_proxy="http://yourproxy"

// bash
export all_proxy="http://yourproxy"
```

## File Struct

#### dist

dist files output by `gulp build`

#### src

source code place here

#### src/assets

static files copies to `dist/assets` exclude src/images

#### src/components

web components defs here,template,styles,class will be compiled into `dist/components/templates`,`dist/components/styles`,`dist/components/`

#### src/entries

main script for each html in project,will be compiled into `dist/`

#### src/pages

main html in project,will be compiled into `dist/`

#### src/scripts

main html in project,will be compiled into `dist/scripts`

#### src/styles

main html in project,will be compiled into `dist/styles`


## About Web Components

after run `gulp dev`,watch `/components/` for more informations


## Todo list

- add more default components
- add more useful example about how to use load components