# Crystal Prism
I started programming in January 2017. I am learning HTML, CSS and JavaScript. My website, [Crystal Prism](http://crystalprism.io), is a portfolio of each of my projects. I aim to incorporate movement, color and shapes to explore design and aesthetics in my projects.

## Timespace
![Timespace](timespace.jpg)

[Timespace](http://crystalprism.io/timespace/index.html) is my first coding project. It takes numbers a step further to depict time, using them to generate movement and color to trace time's passage each second. I use JavaScript to select three digits of the current time string as the x coordinate of the circle and a different set of three digits as the y coordinate. Each circle color is a different set of six digits of the time string, converted to hexadecimal.

## Shapes in Rain
![Shapes in Rain](shapes-in-rain.jpg)

[Shapes in Rain](http://crystalprism.io/shapes-in-rain/index.html) incorporates SVGs and randomization to generate a peaceful scene where the user can clear shapes as they clear their mind. I use JavaScript to generate a random shape from a set of 10 SVGs and give it a set of random coordinates. When the user clicks the outline of one of the shapes, the shape gets "blasted" out of the scene, clearing the space for the heart rain that continues to fall in the background, generated from SVG cloning. The rain and shapes will clear on their own after a certain time interval to minimize system performance.

## Rhythm of Life
![Rhythm of Life](rhythm-of-life.jpg)

[Rhythm of Life](http://crystalprism.io/rhythm-of-life/index.html) is an educational take on the classic game *Snake*. The game allows you to move a heart across an SVG canvas to seek relievers and avoid stressors to maintain a low blood pressure. As you collide with stressors, your blood pressure increases, and the game speeds up. The left side of the game board displays information about blood pressure stressors and relievers, with links to more details on websites like WebMD and the American Heart Association. The game is designed in this way because stressors will constantly arise, but you must seek out relievers to maintain good health. Once you exceed the blood pressure range for stage 2 hypertension, the game ends, and you can record your name and lifespan in the leaderboard. I use [Snap](http://snapsvg.io) to ease canvas and object manipulation, as well as [Howler](https://howlerjs.com) to control the background heartbeat sound.

## CanvaShare
![CanvaShare](canvashare.jpg)

[CanvaShare](http://crystalprism.io/canvashare/index.html) is an interactive drawing program that lets you create drawings in a predefined square shape, using a series of palettes. After you create your drawing, you can give it a title and post it to the gallery and/or download a copy. The gallery displays everyone's images, and when you click one of the images, it becomes your starting canvas so you can add on to it and create a new drawing of your own. The gallery also displays the view count for each image based on the number of times it has been clicked. I use [Snap](http://snapsvg.io) for canvas and object manipulation, as well as [EaselJS](http://www.createjs.com/easeljs) for canvas drawing. CanvaShare is my first project that involves sending data to a backend using JavaScript's fetch method and Python server code.

## Thank You
I am incredibly grateful to my teacher, [Ankur Saxena](https://github.com/as3445). His knowledge, creativity and patience has given me the confidence and inspiration to make these coding projects my own. I would be lost without him.
