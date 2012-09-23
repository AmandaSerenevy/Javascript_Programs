function set_up_page(){
  $("#1st").bind("click",function(){start_game(1)});
  $("#2nd").bind("click",function(){start_game(2)});
  $("#Go").bind("click",submit);
  $("#Changegame").bind("click",changegame);
  $("#Setrules").bind("click",setrules);
  $("#Newgame").bind("click",newgame);
}

function changegame(){
  $("#AlertArea").text("");
  $("#ShowRules").slideUp();
  $("#Gameboard").slideUp();
  $("#ChooseRules").slideDown();
  $("#Again").slideUp();
  return false;
}

function setrules(){
  $("#AlertArea").text("");
  var target = parseFloat($("#target").val());
  var mod=1+parseFloat($("#maximum_addend").val());

  if (mod!=Math.floor(mod) || mod <=0 || target!=Math.floor(target) || target <=0) {
    show_alert("error","Warning!","You must enter whole numbers greater than 0.");
    return false;
  }

  else {
    $("#max").val(mod-1);
    $("#target_num").val(target);
    $("#ChooseRules").slideUp();
    $("#ShowRules").slideDown();
    $("#PlayerOrder").slideDown();
  }

  return false;
}


function newgame(){

  $("#PlayerOrder").slideDown();
  $("#Gameboard").slideUp();
  $("#Again").slideUp();
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
  var target=parseFloat($("#target_num").val());
  var mod=1+parseFloat($("#max").val());
  if (sum%mod == target%mod){return (Math.floor(1+(mod-1)*Math.random()))}
  else {
    var response = mod - (sum%mod) + (target%mod);
    if (response > (mod-1)){
      var response = response - mod;

    }
    return response;}
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
  if (total == parseFloat($("#target_num").val())){
    $("#Newgame").show();
    $("#Go").hide();
    if (entity == "human"){
      show_alert("success", "Congratulations!", "You win!");
      $("#Again").slideDown();
    }
    else{
      show_alert("error","Sorry!", "You lose!");
      $("#YourPlay").hide();
      $("#Again").slideDown();
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

  var max = parseFloat($("#max").val());
  if ((0 >= addend) || (addend > max ) || (addend!=Math.floor(addend))){
      show_alert("error","Warning!","You must add a whole number between 1 and "+max);
      return false;
     }

  if (start_from+addend != sum){
      show_alert("error","Warning!","Check your addition!");
      return false;
    }

  if (sum > parseFloat($("#target_num").val())) {
        show_alert("error","Warning!","You overshot the target! Try adding a smaller number.");
        return false;
      }

    return true;
}
