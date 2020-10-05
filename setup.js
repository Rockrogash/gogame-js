let grid;
let resolution;
let cols;
let rows;

let whiteGroups;
let blackGroups;

let groups;
let groupsTemp;
let group;

let mousePos;
let player;
let size;

const Players = {WHITE:0, BLACK:1};
const neighbors = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
const fieldSizes = {SMALL: 9, MIDDLE: 13, BIG: 19};


function setup() {

  size = fieldSizes.SMALL;
  createCanvas(900,900);

  //img = loadImage("/assets/background_coffeestain.jpeg");
  resolution = width/size;
  cols = size;
  rows = size;
  grid = create2DArray(cols, rows);
  player = Players.WHITE;
  whiteGroups = [];
  blackGroups = [];
  groups = [whiteGroups, blackGroups];
}



function draw() {
  background(94, 253, 173);

  //Draw Lines
  for (var i = 0; i < cols + 1; i++) {
    let x = i*resolution-resolution/2;
    stroke(0);
    line(x, resolution/2, x, height-resolution/2);
  }

  for (var i = 0; i < rows + 1; i++) {
    let y = i*resolution-resolution/2;
    stroke(0);
    line(resolution/2, y, width-resolution/2, y);
  }


  //Draw Stones
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      let x = i*resolution;
      let y = j*resolution;
      noStroke();
      if (grid[i][j] == 1) {
        fill(31, 26, 56);
        circle(x+(resolution/2), y+(resolution/2), resolution*0.9);
      }
      else if (grid[i][j] == 0) {
        stroke(31, 26, 56);
        fill(231, 238, 236);
        circle(x+(resolution/2), y+(resolution/2), resolution*0.9);
      }
    }
  }

}


function create2DArray(cols, rows){
  let arr = new Array(cols);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
  }
  return arr;
}


function formGroups (group, player) {

  groups[player].push(group);
  let vector = group.stones[group.stones.length - 1];

  for (let i = 0; i < groups[player].length - 1; i++) {
    for (let j = 0; j < groups[player][i].stones.length; j++) {
      if((((abs(groups[player][i].stones[j].x - vector.x) == 1) && ((groups[player][i].stones[j].y - vector.y) == 0 )) || ((abs(groups[player][i].stones[j].y - vector.y) == 1 ) && ((groups[player][i].stones[j].x - vector.x) == 0 )))) {
        let newGroup = new Group(concat(groups[player][i].stones, group.stones));
        groups[player].splice(i, 1);
        groups[player].pop();
        return formGroups (newGroup, player);
      }
    }
  }
}


function mouseClicked () {
  //Determine Mouse Position
  mousePos = {x: (round(map(mouseX, 0, width, -0.5, size - 0.5))), y: (round(map(mouseY, 0, height, -0.5, size - 0.5)))};
  //Check if Mouse is on the grid
  if (mousePos.x >= 0 && mousePos.x <= (size - 1) && mousePos.y >= 0 && mousePos.y <= (size - 1)){
    //Check if field is empty
    if (grid[mousePos.x][mousePos.y] == null) {

      groupsTemp = _.cloneDeep(groups);
      gridTemp = _.cloneDeep(grid);

      let validMove = true;

      //Place stone and form groups
      grid[mousePos.x][mousePos.y] = player;
      let newGroup = new Group([{x: mousePos.x, y : mousePos.y}]);
      formGroups(newGroup, player);


      //Calculate liberties of all groups
      for (var i = 0; i < groups[0].length; i++) {
        groups[0][i].calcLiberties();
      }

      for (var i = 0; i < groups[1].length; i++) {
        groups[1][i].calcLiberties();
      }


      //Check if liberties of new Group are 0
      if (groups[player][groups[player].length - 1].liberties.length == 0) {
        let killCount = 0;

        //Check if liberties in any group of other player are 0
        for (var i = groups[switchPlayer(player)].length - 1; i >= 0 ; i--) {
          //If they are, increment killCount
          if (groups[switchPlayer(player)][i].liberties.length == 0) {
            killCount++;
            //Reset grid for that group
            for (var j = 0; j < groups[switchPlayer(player)][i].stones.length; j++) {
              grid[groups[switchPlayer(player)][i].stones[j].x][groups[switchPlayer(player)][i].stones[j].y] = null;
            }
            //Remove that group from groups
            groups[switchPlayer(player)].splice(i, 1);
          }
        }

        //Check if no groups have been killed, if so the move was not valid
        if (killCount == 0) {
          validMove = false;
        }

        //Otherwise calculate Liberties of other player
        else {
          for (var i = 0; i < groups[player].length; i++) {
            groups[player][i].calcLiberties();
          }
        }

      }

      else {
        //Check if liberties in any group of other player are 0
        if (groups[switchPlayer(player)].length) {
          for (var i = groups[switchPlayer(player)].length - 1; i >= 0 ; i--) {
            if (groups[switchPlayer(player)][i].liberties.length == 0) {
              //Reset grid for that group
              for (var j = 0; j < groups[switchPlayer(player)][i].stones.length; j++) {
                grid[groups[switchPlayer(player)][i].stones[j].x][groups[switchPlayer(player)][i].stones[j].y] = null;
              }

              //Remove that group from groups
              groups[switchPlayer(player)].splice(i, 1);
            }
          }
        }

        for (var i = 0; i < groups[player].length; i++) {
          groups[player][i].calcLiberties();
        }
      }


      //If the move was valid, other players' move
      if (validMove) {
        player = switchPlayer(player);
      }

      //Else, reset state of game before the move
      else {
        groups = _.cloneDeep(groupsTemp);
        grid = _.cloneDeep(gridTemp);
      }
    }
  }
}




function switchPlayer (player) {
  return abs(player - 1);
}


function inBounds (i, j, stone) {
  return (((-1 < (stone.x + i)) && ((stone.x + i) < size)) && ((-1 < (stone.y + j)) && ((stone.y + j) < size)));
}
