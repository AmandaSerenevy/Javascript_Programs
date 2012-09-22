var target=30;
var mod=6;

function set_up_page(){
  $("#1st").bind("click",function(){start_game(1)});
  $("#2nd").bind("click",function(){start_game(2)});
  $("#Go").bind("click",submit);
  $("#Newgame").bind("click",newgame);
}

function newgame(){
  $("#PlayerOrder").slideDown();
  $("#Gameboard").slideUp();
  reset_gameboard();
  return false;
}

$(set_up_page);

function start_game(order){
  reset_gameboard();

  $("#PlayerOrder").slideUp();
  $("#Gameboard").slideDown();

  if (order==2) {
    take_turn();
  }
  else {
    $("#LastPlay").hide();
  }
}


function show_alert(type,strong,text){
  $("#AlertArea").append($('<div class="alert alert-'+type+' fade in" ><button type="button" class="close" data-dismiss="alert">x</button> <strong>'+strong+'</strong> '+text+'</div>'));
}

function reset_gameboard(){
  $("#last_play_start").val("");
  $("#last_play_addend").val("");
  $("#last_play_sum").val("");
  $("#start_from").val("0");
  $("#addend").val("");
  $("#sum").val("");
  $("#Go").show();
  $("#Newgame").hide();
  $("#YourPlay").show();
  $("#AlertArea").text("");
  return false;
}

function take_turn(){
  $("#LastPlay").slideDown();
  var sum=parseInt($("#start_from").val(),10);
  update_gameboard(sum,decide_what_to_add(sum));
  var total = sum+decide_what_to_add(sum);
  check_win("computer",total);
}


function decide_what_to_add(sum){
  if (sum%mod==0){return (Math.floor(1+(mod-1)*Math.random()))}
  else {return (mod-sum%mod)}
}

function update_gameboard(old_sum,add_value){
  var start_from=old_sum+add_value;
  $("#last_play_start").val(old_sum);
  $("#last_play_addend").val(add_value);
  $("#last_play_sum").val(start_from);
  $("#start_from").val(start_from);
  $("#addend").val("");
  $("#sum").val("");
}

function submit(){
  $("#AlertArea").text("");
  if (check_inputs()){
    var addend  = parseInt($("#addend").val(),10);
    var start_from = parseInt($("#start_from").val(),10);
    if (!check_win("human",start_from+addend)){
      update_gameboard(start_from,addend);
      take_turn();
    }
  }

  return false;
}

function check_win(entity,total){
  if (total == target){
    $("#Newgame").show();
    $("#Go").hide();
    if (entity == "human"){
      show_alert("success", "Congratulations!", "You win!");
    }
    else{
      show_alert("error","Sorry!", "You lose!");
      $("#YourPlay").hide();
    }
    return true;
  }
  return false;
}

function check_inputs(){
  var addend  = parseFloat($("#addend").val());
  var start_from = parseInt($("#start_from").val(),10);
  var sum = parseFloat($("#sum").val());

  if (!addend || !sum) {
    show_alert("error","Warning!","Please enter an addend and a sum.");
    return false;
  }

  if ((0 >= addend) || (addend > mod-1 ) || (addend!=Math.floor(addend))){
      show_alert("error","Warning!","You must add a whole number between 1 and "+(mod-1));
      return false;
     }

  if (start_from+addend != sum){
      show_alert("error","Warning!","Check your addition!");
      return false;
    }

  if (sum > target) {
        show_alert("error","Warning!","You overshot the target! Try adding a smaller number.");
        return false;
      }

    return true;
}
