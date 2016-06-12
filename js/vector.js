function Vector2(x,y){
  this.x = x || 0;
  this.y = y || 0;
}
Vector2.prototype = {
  set: function(x,y){
    this.x = x;
    this.y = y;
  },
  add: function(vec){
    this.x += vec.x;
    this.y += vec.y;
  },
  times: function(num){
    return new Vector2(this.x*num, this.y*num);
  },
  plus: function(vec){
    return new Vector2(this.x+vec.x, this.y+vec.y);
  },
  multiple: function(num){
    this.x *= num;
    this.y *= num;
  },
  sqLength: function(){
    return this.x*this.x + this.y*this.y;
  },
  length: function(){
    return Math.sqrt( this.sqLength() );
  },
  normalize: function(){
    return this.times(1/this.length);
  },
  dot: function(vec){
    return this.x*vec.x + this.y*vec.y;
  },
  cross: function(vec){
    return (this.x*vec.y - this.y*vec.x);
  },
};
