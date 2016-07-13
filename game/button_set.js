var isDragging = false;
var draggabled = true;
var isToShow = true;
var mousedown_posx, mousedown_posy;

var Modal = {								
	init_out: function()
	{
		var input = arguments[0];

		if('content' in input)
		{
			var out_window = document.getElementById('out-window');
			out_window.innerHTML = "<h2>游戏简介：</h2>"
			+ "<h4>&nbsp;&nbsp;你是一个年轻有抱负的枪手，你要在这片类似扫雷的土地上，找到所有宝藏并安全离开，在此期间，你可能会遇到邪恶怪物的攻击。举起你的枪，消灭它们！</h3><h3>游戏目标：<br>&nbsp;&nbsp;找到所有的宝藏。</h3><h3>游戏操作：</h3><h4>W：前进， A：向左移动， S：后退， D：向右移动，Space：跳跃；<br>&nbsp;&nbsp;右键挖矿，左键攻击怪物，被怪物攻击会扣一定的血量，血量为零即失败，怪物的移动速度会随游戏的进行而变快。</h4><h5>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;任意键退出...</h5>";
		}
	}
}
	
function init_out_window()
{
	document.getElementById('out-window').style.left = '20px';
	document.getElementById('out-window').style.top = '200px';
}

function activeMouseEvent()
{
	document.onkeydown = function(event)
	{
		var e = event || window.event || arguments.callee.caller.arguments[0];
			
		if(e)
		{
			var out_window = document.getElementById('out-window');
			out_window.style.display = 'none';		
		}
	}

	document.onmousedown = function(event)
	{
		var e = event || window.event || arguments.callee.caller.arguments[0];
		mousedown_posx = e.clientX;
		mousedown_posy = e.clientY;

		var dragged = document.getElementById('out-window');

		if(draggabled == true && e.clientX >= dragged.offsetLeft && e.clientX <= (dragged.offsetLeft + dragged.offsetWidth)
			&& e.clientY >= dragged.offsetTop && e.clientY <= (dragged.offsetTop + dragged.offsetHeight))
		{
			isDragging = true;
			isToShow = false;
		}
	}

	document.onmousemove = function(event)
	{
		if(isDragging == false)
		{
			return;
		}
		var e = event || window.event || arguments.callee.caller.arguments[0];
		var dragged = document.getElementById('out-window');

		dragged.style.left = parseInt(dragged.style.left.replace('px', '')) + (e.clientX - mousedown_posx) + "px";				
		dragged.style.top = parseInt(dragged.style.top.replace('px', '')) + (e.clientY - mousedown_posy) + "px";
										
		mousedown_posx = e.clientX;
		mousedown_posy = e.clientY;					
	}

	document.onmouseup = function(event)
	{
		isDragging = false;
	}
}

function showOutWindow()
{
	var out_window = document.getElementById('out-window');
	out_window.style.display = 'block';
}

activeMouseEvent();

init_out_window(); 
Modal.init_out({content:'1fgshdjhgfdsfkhjdsg'});

function createButtonListener()
{
	document.getElementById('startbutton').onclick = function(){
		document.getElementById('startpage').style.zindex = 0;
		document.getElementById('startpage').style.display = 'none';
		
		var out_window = document.getElementById('out-window');
		out_window.style.display = 'none';
		$('#leftpoint').show();
		$('#backbutton').show();	
		$('#heropoint').show();
		$('#hp_bar').show();	
		$('#hp_bar').css('width', document.body.clientWidth);	
		isGameOver = false;
		bombhascreated = false;
		init();
		render();					
	}

	document.getElementById('helpbutton').onclick = function()
	{
		showOutWindow();
	}

	document.getElementById('backbutton').onclick = function()
	{
		clearScene();
		document.getElementById('startpage').style.zindex = 100;
		document.getElementById('startpage').style.display = 'block';
		isGameOver = true;
		$('.grids').remove();
		$('#heropoint').hide();	
		$('#backbutton').hide();
		$('#hp_bar').hide();
		$('#endpage').hide();
		$('#winpage').hide();
		$('#leftpoint').hide();

		activeMouseEvent();
	}
}

createButtonListener();	