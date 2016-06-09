(function(){
//Matter.js モジュール 初期設定
var Engine = Matter.Engine, //物理シュミレーションおよびレンダリングを管理する
  Render = Matter.Render, //デバッグ用の描画
	World = Matter.World, //物理演算領域の作成・操作するメソッドを含む
	//Body = Matter.Body, //剛体のモデルを作成・操作するメソッドを含む
	Bodies = Matter.Bodies, //一般的な剛体モデルを作成するメソッドを含む
	Constraint = Matter.Constraint, //制約を作成・操作するメソッドを含む
	Composites = Matter.Composites,
	//Common = Matter.Common,
	//Vertices = Matter.Vertices, //頂点のセットを作成・操作するメソッドを含む
	MouseConstraint = Matter.MouseConstraint; //マウスの制約を作成するためのメソッドが含む

const _SCALE = 40;
const _OFFSET = {x:320, y:470};
var GAME = {};
var engine = null;

GAME.init = function(){
  //Engine作成:
  var container = document.getElementById("canvas-container");
  engine = Engine.create(container, {
    render: {
      options: {
        wireframes: false,
        width: 640,
        height: 480,
        background: "rgba(0,0,0,0)"
      }
    }
  });

  //マウス操作追加
  var mouseConstraint = MouseConstraint.create(engine);
  World.add(engine.world, mouseConstraint);

  var order = [     // branches[fromX,fromY,toX,toY]
    [-1,0,0,-2], [1,0,0,-2], [0,-2,0,-4], [0,-4,0,-6],

  ];


  //節
  var nodes = {};
  for(var i=0; i<order.length; i++){
    for(var j=0; j<2; j++){
      if(! (order[i][j*2+0]+":"+order[i][j*2+1] in nodes) ){
        var x = order[i][j*2+0];
        var y = order[i][j*2+1];

        nodes[ x+":"+y ] = {
          x: x,
          y: y,
          value: 0,
          obj: Bodies.circle(_OFFSET.x + x*_SCALE, _OFFSET.y + y*_SCALE, 5, {
            timeScale: 0.5,
            render: {
                strokeStyle: "#008000",
                fillStyle: "#008000"
            }
          }),
        };
        if( y == 0 ){continue;}
        World.add(engine.world, nodes[ x+":"+y ].obj);

        var branch = Constraint.create({
          bodyA: nodes[ x+":"+y ].obj,
          pointB: {x:nodes[ x+":"+y ].obj.position.x, y:nodes[ x+":"+y ].obj.position.y},
          stiffness: 0.02,
          render: {
            visible: false
          },
        });
        World.add(engine.world, branch);
      }
    }
  }

  //枝
  for(var i=0; i<order.length; i++){
    var A = [ order[i][0], order[i][1] ];
    var B = [ order[i][2], order[i][3] ];
    var branch =  Constraint.create({
      bodyA: nodes[A[0]+":"+A[1]].obj,
      bodyB: nodes[B[0]+":"+B[1]].obj,
      stiffness: 0.2,
      render: {
        strokeStyle: "#008000",
        lineWidth: 2,
      },
    });
    if( A[1] == 0 ){
      delete branch.bodyA;
      branch.pointA = {x:_OFFSET.x+A[0]*_SCALE, y:_OFFSET.y+A[1]*_SCALE};
    }
    if( B[1] == 0 ){
      delete branch.bodyB;
      branch.pointB = {x:_OFFSET.x+B[0]*_SCALE, y:_OFFSET.y+B[1]*_SCALE};
    }
    World.add(engine.world, branch);
  }


  var softbody = Composites.softBody(100,50,1,5,0,0,true,10,{
    friction: 0.05,
    frictionStatic: 0.1,
    render: { visible: true }
  });
  World.add(engine.world, softbody);

  //床
  World.add(engine.world, [Bodies.rectangle(320, 480, 650, 20, {
    isStatic: true,
    render: {
      fillStyle: "#00ff00",
    }
  })]);

  //ball
  var x = 64*5;
  var y = 0;
  World.add(engine.world, Bodies.circle(x, y, 30, {
    density: 0.0005,
    frictionAir: 0.01,
    restitution: 1,
    friction: 0.01
  }));


  Engine.run(engine);
};
if( window.addEventListener ){
  window.addEventListener('load', GAME.init);
}else if( window.attachEvent ){
  window.attachEvent('load', GAME.init);
}

})();
