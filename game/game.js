//相机及场景
var isGameOver = false;
var scene = null;
var cubeCamera = null;
var camera = null;
var renderer = null; 
var skybox = null;
var bomb_map = null;
var move_map = null;
var bombnum = 0;
var leftnum = 0;
var bombhascreated = false;

//游戏时间
var gametime = 0;
var game_time_timer = null;

function createGameTime()
{
	gametime = 0;
	game_time_timer = null;
}

function game_time_counter()
{
	game_time_timer = setInterval("time_count()", 1000);
}

function time_count()
{
	gametime++;
}

//角色属性
var hp_all = 100;
var hp = 100;

function createHP()
{
	hp_all = 100;
	hp = 100;
}
			
// 创建光源 
var pointLight = null;

function createLight()
{
	pointLight = new THREE.PointLight(0xFFFFFF);  
	pointLight.position.x = 0; 
	pointLight.position.y = 1000; 
	pointLight.position.z = 0; 
}
						

//重力相关
var jump_up_time = 99;
var jump_highest_dis = 0;
var g = 0.000049;
var jumping_time = [];
var isJumping = [];
var jump_dis = [];
jumping_time.push(0);
isJumping.push(false);
var jumpTimer = null;

function initGravity()
{
	jump_up_time = 99;
	jump_highest_dis = 0.5 * g * jump_up_time * jump_up_time;
	g = 0.000049;
	jumping_time = [];
	isJumping = [];
	jump_dis = [];
	jumping_time.push(0);
	isJumping.push(false);
	jumpTimer = null;

	for(var i = 0; i <= jump_up_time + 1; i++)
	{
		jump_dis.push(0);		
	}

	for(var i = jump_up_time; i >= 0; i--)
	{
		jump_dis[i] = 0.5 * g * (jump_up_time + 1 - i) * (jump_up_time + 1 - i) - jump_dis[i + 1];
	}
}

function jumpMove()
{
	if(isJumping[0] == true)
	{
		if(jumping_time[0] <= jump_up_time)
		{
			person_model.position.y += jump_dis[jumping_time[0]];
			camera.position.y += jump_dis[jumping_time[0]];
		}
		else
		{
			person_model.position.y += -1 * jump_dis[2 * jump_up_time + 1 - jumping_time[0]];
			camera.position.y += -1 * jump_dis[2 * jump_up_time + 1 - jumping_time[0]];
		}
		jumping_time[0]++;			
					
		if(jumping_time[0] >= 2 * jump_up_time + 2)
		{
			isJumping[0] = false;
			jumping_time[0] = 0;
			clearInterval(jumpTimer);
		}
	}
}

//移动相关
var movedirection = 0;
//2D地图对应span
var two_dim_map_list = null;

//一些常量
var mapsize = 20;
var cube_side_length = 1;
var cubes = [];
var camera_step = 0.05;
var ghost_speed_scale = 1 + Math.floor(0.005 * gametime / 60);
var ghost_step = 0.01;

//图片、材料设置
var grassmap = null;
var grassTexture = null;
var grassMaterial = null;

var wall = null;
var wallTexture = null;
var wallMaterial = null;

function loadPic()
{
	grassmap = "grass.jpg";
	grassTexture = THREE.ImageUtils.loadTexture(grassmap);
	grassMaterial = new THREE.MeshBasicMaterial({map:grassTexture});

	wall = "wall.jpg";
	wallTexture = THREE.ImageUtils.loadTexture(wall);
	wallMaterial = new THREE.MeshBasicMaterial({map:wallTexture});
}
			
//天空盒设置
function createSkyBox()
{
	var skypics = ["sky_right.jpg", "sky_left.jpg", "sky_top.jpg", "sky_bottom.jpg", "sky_back.jpg", "sky_front.jpg"];
	var skyTextTure = THREE.ImageUtils.loadTextureCube(skypics);
	//skyTextTure.minFilter = THREE.LinearFilter;
	var shader = THREE.ShaderLib["cube"];
	shader.uniforms["tCube"].value = skyTextTure;
	var skyboxMaterial = new THREE.ShaderMaterial({
		uniforms: shader.uniforms,
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		depthWrite: false,
		side: THREE.BackSide
	});
	var skyboxGeom = new THREE.BoxGeometry(1000, 1000, 1000);
	skybox = new THREE.Mesh(skyboxGeom, skyboxMaterial);		
}
						
//挖到鬼及鬼的控制
var ghosts_up = [];
var ghosts_rising = [];
var ghost_timer = null;
var ghosts_pos_point = [];

function ghost_riseup()
{
	ghosts_rising.push(arguments[0]);
	scene.add(arguments[0]);

	if(ghost_timer == null)
	{   			
	    ghost_timer = setInterval('rising_ghosts()', 100);
	}
}

function rising_ghosts()
{
	var temp_ghosts = [];

	for(var i = 0; i < ghosts_rising.length; i++)
	{
		ghosts_rising[i].position.y += 0.1;    			
		temp_ghosts.push(ghosts_rising[i]);
	}

	ghosts_rising = [];

	for(var i = 0; i < temp_ghosts.length; i++)
	{
		if(temp_ghosts[i].position.y < 0.8)
		{
			ghosts_rising.push(temp_ghosts[i]);
		}
		else
		{
			ghosts_up.push(temp_ghosts[i]);

			var newDiv = document.createElement("div");
			newDiv.style.cssText = "width: 4px;height:4px;border-radius: 4px;position: absolute;background-color: black;";
			document.body.appendChild(newDiv);

			ghosts_pos_point.push(newDiv);
		}
	}

	if(ghosts_rising.length == 0)
	{
		clearInterval(ghost_timer);
		ghost_timer = null;
	}
}

function ghostMoving()
{
	if(person_model != null)
	{
		var aim = person_model;

 		for(var i = 0; i < ghosts_up.length; i++)
 		{
 			ghosts_up[i].lookAt(new THREE.Vector3(aim.position.x, 0.85, aim.position.z));

 			var direct_vector = new THREE.Vector3(aim.position.x - ghosts_up[i].position.x, aim.position.y - ghosts_up[i].position.y, aim.position.z - ghosts_up[i].position.z);

 			direct_vector = direct_vector.normalize();
 			direct_vector.multiplyScalar(ghost_step * ghost_speed_scale);

 			ghosts_up[i].position.x += direct_vector.x;
 			ghosts_up[i].position.z += direct_vector.z;
 		}	
	} 		
}

function ghost_killed()
{
	var i = 0;
	for(i = 0; i < ghosts_up.length; i++)
	{
		if(ghosts_up[i] == arguments[0])
		{
			break;
		}
	}

	var temp = ghosts_up[0];
	ghosts_up[0] = ghosts_up[i];
	ghosts_up[i] = temp;

	var temp_div = ghosts_pos_point[0];
	ghosts_pos_point[0] = ghosts_pos_point[i];
	ghosts_pos_point[i] = temp_div;

	var killed_model = ghosts_up.shift();
	scene.remove(killed_model);
	var toDelete = ghosts_pos_point.shift();
	document.body.removeChild(toDelete);
}	    

//添加模型
var model_texture = new THREE.ImageUtils.loadTexture("sdsd004.jpg");	
var model_material = new THREE.MeshLambertMaterial({map: model_texture});

 var loader = new THREE.JSONLoader();
 
 var person_model = null;       
 var model_boundingBox = null;

 function addHeroModel()
 {
 	loader.load("kulou.js",  function (event) {
         var model_geometry = event;
         var model_mesh = new THREE.Mesh(model_geometry, model_material);

         person_model = model_mesh;

         if(person_model.geometry.boundingBox == null)
         {
         	person_model.geometry.boundingBox = new THREE.Box3();
         }
        	person_model.geometry.boundingBox.setFromPoints(person_model.geometry.vertices);
        	
         model_boundingBox = person_model.geometry.boundingBox.clone();        

        person_model.position.setY(0.8);
        person_model.lookAt(new THREE.Vector3(0, 1.5, -1));
        
        camera.position.setY(1.5);
        camera.position.setX(person_model.position.x);
        camera.position.setZ(person_model.position.z);
        camera.lookAt(new THREE.Vector3(0, 1.5, -1));

        scene.add(person_model);		       		        
     });
 }   

 function init()
{				
	scene = new THREE.Scene();
	cubeCamera = new THREE.CubeCamera(1, 100000, 128);
	camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000); 

	createGameTime();
	createHP();
	createLight();
	initGravity();
	loadPic();
	createSkyBox();

	scene.add(cubeCamera);
	scene.add(pointLight); 
	scene.add(skybox);	

	bomb_map = creatBomb();
	move_map = new Array();
	for(var i = 0; i < mapsize; i++)
	{
		move_map[i] = new Array();
		for(var j = 0; j < mapsize; j++)
		{
			move_map[i][j] = 0;
		}
	}

	var geometry = new THREE.BoxGeometry(cube_side_length, cube_side_length, cube_side_length);
	var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
	var material_frame = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true, wireframeLinewidth: 2, vertexColors: 0x000000});

	var wall_geometry = new THREE.BoxGeometry(cube_side_length, cube_side_length + 10, cube_side_length);

	for(var i = 0; i < mapsize; i++)
	{
		for(var j = 0; j < mapsize; j++)
		{					
			var frame_cube = new THREE.Mesh(geometry, grassMaterial);
			scene.add(frame_cube);
			frame_cube.position.x = (j - (mapsize / 2)) * cube_side_length;
			frame_cube.position.y = 0;
			frame_cube.position.z = (i - (mapsize / 2)) * cube_side_length;
		}
	}

	//血条
	document.getElementById('hp_bar').style.width = document.body.clientWidth;    		

	/*for(var i = -1; i <= mapsize; i++)
	{
		var wall_cube = new THREE.Mesh(wall_geometry, wallMaterial);
		scene.add(wall_cube);
		wall_cube.position.x = (i - (mapsize / 2)) * cube_side_length;
		wall_cube.position.y = 0;
		wall_cube.position.z = -11 * cube_side_length;
	}

	for(var i = -1; i <= mapsize; i++)
	{
		var wall_cube = new THREE.Mesh(wall_geometry, wallMaterial);
		scene.add(wall_cube);
		wall_cube.position.x = (i - (mapsize / 2)) * cube_side_length;
		wall_cube.position.y = 0;
		wall_cube.position.z = 10 * cube_side_length;
	}

	for(var i = 0; i < mapsize; i++)
	{
		var wall_cube = new THREE.Mesh(wall_geometry, wallMaterial);
		scene.add(wall_cube);
		wall_cube.position.x = -11 * cube_side_length;
		wall_cube.position.y = 0;
		wall_cube.position.z = (i - (mapsize / 2)) * cube_side_length;
	}

	for(var i = 0; i < mapsize; i++)
	{
		var wall_cube = new THREE.Mesh(wall_geometry, wallMaterial);
		scene.add(wall_cube);
		wall_cube.position.x = 10 * cube_side_length;
		wall_cube.position.y = 0;
		wall_cube.position.z = (i - (mapsize / 2)) * cube_side_length;
	}*/

	addHeroModel();

	createMouseListener();	

	two_dim_map_create();	

	game_time_counter();	

	setGameKeyEvent();

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	isGameOver = false;

	$('#leftpoint').html('剩余宝藏数: ' + leftnum);
}      		    	

//子弹
var bulletnum = 10;
var bullets = [];
var direct = [];

function createBullet()
{
	bullets = [];
	direct = [];
}

//鼠标事件
document.body.addEventListener('contextmenu', function(event){
	event.preventDefault();
}, false);	    	

//	
 function setGameKeyEvent()
 {
 	document.onkeydown=function(event){
         var e = event || window.event || arguments.callee.caller.arguments[0];
         
         if(e && e.keyCode==87)
         { // 上
             movedirection = 1;
         }
         if(e && e.keyCode==83)
         { //下
             movedirection = 2;
         }            
         if(e && e.keyCode==65)
         { // 左
         	movedirection = 3;
         }
         if(e && e.keyCode==68)
         { // 右
             movedirection = 4;
         }
         if(e && e.keyCode==32)
         { // 空格
             if(isJumping[0] == false)
             {
             	jumping_time[0] = 0;
             	isJumping[0] = true;
             	jumpTimer = setInterval('jumpMove()', 10);
             }
         }
      };

      document.onkeyup=function(event){
         var e = event || window.event || arguments.callee.caller.arguments[0];

         if(e && (e.keyCode==87 || e.keyCode==83 || e.keyCode==65 || e.keyCode==68))
         { // 上
             movedirection = 0;
         }
     }
 }				

var mousepos = 0;
var mouseuppos = 0;

function createMouseListener()
 {         	
  	mousepos = 0;
  	mouseuppos = 0;

  	document.getElementById('wf').onmousemove = function mouseMoveActor(event)
     {
         var e = event || window.event;
         if((e.clientX - (document.body.clientWidth / 2)) > 150)
         {
             mousepos = -1;
             //person_model.rotation.y -= 0.01;
         }    
         else if((e.clientX - (document.body.clientWidth / 2)) < -150)
         {
             mousepos = 1;
             //person_model.rotation.y += 0.01;
         }     
         else
         {
             mousepos = 0;
         }       

         var m = e.clientY;
         if(m < document.body.clientHeight / 4)
         {
             m = document.body.clientHeight / 4;
         }
         if(m > document.body.clientHeight * 3 / 4)
         {
             m = document.body.clientHeight * 3 / 4;
         }
         mouseuppos = -1 * ((m - document.body.clientHeight / 2) / (document.body.clientHeight / 2)) * Math.PI / 3;
     }

     document.getElementById('wf').onmousedown=function(e){
 		if(e.button == 0)
 		{
 			//开火
 			var bullet = new THREE.Mesh(new THREE.SphereGeometry(0.1, 0.1), new THREE.MeshLambertMaterial({color:0xff0000}));
 			bullet.position.setX(person_model.position.x);
 			bullet.position.setY(person_model.position.y + 0.1);
 			bullet.position.setZ(person_model.position.z);
 			scene.add(bullet);
 			bullets.push(bullet);
 			
 			var raycaster = new THREE.Raycaster(); 
			var mouse = new THREE.Vector2(); 

			mouse.x = (event.clientX / renderer.domElement.width) * 2 - 1;
			mouse.y = -(event.clientY / renderer.domElement.height) * 2 + 1;

			raycaster.setFromCamera(mouse, camera);

 			var new_direct = new THREE.Vector3(raycaster.ray.direction.x, raycaster.ray.direction.y, raycaster.ray.direction.z);

 			direct.push(new_direct);
 		}
 		else if(e.button == 2)
 		{
 			if(isJumping[0] == true || bombhascreated == false)
 			{
 				return;
 			}
 			//挖
 			var dig_pos = person_model.position;
 			var row = Math.floor((dig_pos.x + 10) / cube_side_length);
 			var col = Math.floor((dig_pos.z + 10) / cube_side_length);
 			console.log(row, col);

 			if(move_map[row][col] != 0)
 			{
 				return;
 			}

 			move_map[row][col] = 1;

 			if(bomb_map[row][col] == 0)           //挖到鬼
 			{
 				var enemy_model = null;

 				enemy_model = person_model.clone();
	            enemy_model.position.setY(-1);
		        enemy_model.position.setX(person_model.position.x);
		        enemy_model.position.setZ(person_model.position.z);		        

		        enemy_model.geometry.boundingBox = model_boundingBox;

		        ghost_riseup(enemy_model);
 			}
 			else
 			{
 				leftnum--;
 			}

 			
 			var around_count = displayPos(row, col);
 			two_dim_map_list[row][col].innerHTML = around_count;

 			$('#leftpoint').html("剩余宝藏数: " + leftnum);

 			if(leftnum <= 0)
 			{
 				clearScene();
 				isGameOver = true;
 				$('.grids').remove();
				$('#heropoint').hide();					
				$('#hp_bar').hide();
				$('#winpage').show();
				$('#leftpoint').hide();
 			}
 		}  		
 	};
 }

function ghost_bite()
{
	if(person_model != null)
	{
		for(var i = 0; i < ghosts_up.length; i++)
		{
			var ghost_pos_temp = ghosts_up[i].position;
			var mypos = person_model.position;

			if((ghost_pos_temp.x - mypos.x) * (ghost_pos_temp.x - mypos.x) + (ghost_pos_temp.y - mypos.y)* (ghost_pos_temp.y - mypos.y)
				+ (ghost_pos_temp.z - mypos.z) * (ghost_pos_temp.z - mypos.z) <= person_model.geometry.boundingSphere.radius)
			{						
				var is_crash = isCrashed(person_model, ghosts_up[i]);
				if(is_crash == true)
				{
					hp -= 0.1;
					if(hp < 0)
					{
						break;
					}
				}
			}
		}
	}
}

function person_model_move_xz()
{
	if(person_model != null)
	{
		var direction = person_model.getWorldDirection();
     	direction.multiplyScalar(camera_step);

		if(movedirection == 1)
		{						
			person_model.position.x += direction.x;
             person_model.position.z += direction.z;
             camera.position.x += direction.x;
             camera.position.z += direction.z;
		}
		else if(movedirection == 2)
		{
			person_model.position.x -= direction.x;
             person_model.position.z -= direction.z;
             camera.position.x -= direction.x;
             camera.position.z -= direction.z;
		}
		else if(movedirection == 3)
		{
			direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
             person_model.position.x += direction.x;
             person_model.position.z += direction.z;
             camera.position.x += direction.x;
             camera.position.z += direction.z;
		}
		else if(movedirection == 4)
		{
			direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
             person_model.position.x += direction.x;
             person_model.position.z += direction.z;
             camera.position.x += direction.x;
             camera.position.z += direction.z;
		}

		if(person_model.position.x > (mapsize / 2) * cube_side_length - 0.5)
		{
			person_model.position.x = (mapsize / 2) * cube_side_length - 0.5;
			camera.position.x = person_model.position.x;
		}
		else if(person_model.position.x < -1 * (mapsize / 2) * cube_side_length)
		{
			person_model.position.x = -1 * (mapsize / 2) * cube_side_length;
			camera.position.x = person_model.position.x;
		}

		if(person_model.position.z > (mapsize / 2) * cube_side_length - 0.5)
		{
			person_model.position.z = (mapsize / 2) * cube_side_length - 0.5;

			camera.position.z = person_model.position.z;
		}
		else if(person_model.position.z < -1 * (mapsize / 2) * cube_side_length)
		{
			person_model.position.z = -1 * (mapsize / 2) * cube_side_length;
			camera.position.z = person_model.position.z;
		}
	}
}

function person_model_move_y()
{
	if(person_model != null)
	{
		var origin_dir = camera.getWorldDirection();

		var new_dir = new THREE.Vector3(0, 0, 0);
		new_dir.x = Math.cos(mouseuppos) * origin_dir.x;
		new_dir.z = Math.cos(mouseuppos) * origin_dir.z;
		new_dir.y = Math.sin(mouseuppos);
						
		camera.lookAt(new THREE.Vector3(camera.position.x + new_dir.x, camera.position.y + new_dir.y, camera.position.z + new_dir.z));

		origin_dir = camera.getWorldDirection();

		var po = new THREE.Vector3(origin_dir.x, origin_dir.y, origin_dir.z);				
		po.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.01 * mousepos);

		camera.lookAt(new THREE.Vector3(po.x + camera.position.x, po.y + camera.position.y, po.z + camera.position.z));

		var origin_dir_person = person_model.getWorldDirection();

		var new_dir_person = new THREE.Vector3(0, 0, 0);
		new_dir_person.x = Math.cos(mouseuppos) * origin_dir_person.x;
		new_dir_person.z = Math.cos(mouseuppos) * origin_dir_person.z;
		new_dir_person.y = Math.sin(mouseuppos);
						
		person_model.lookAt(new THREE.Vector3(person_model.position.x + new_dir_person.x, person_model.position.y + new_dir_person.y, person_model.position.z + new_dir_person.z));

		origin_dir_person = person_model.getWorldDirection();

		var po_person = new THREE.Vector3(origin_dir_person.x, origin_dir_person.y, origin_dir_person.z);				
		po_person.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.01 * mousepos);

		person_model.lookAt(new THREE.Vector3(po_person.x + person_model.position.x, po_person.y + person_model.position.y, po_person.z + person_model.position.z));
	}
}

function bullet_move()
{
	var to_delete_bullets = [];
	var to_delete_direct = [];
	var temp_save_bullets = [];
	var temp_save_direct = [];

	for(var i = 0; i < bullets.length; i++)
	{
		if(Math.abs(bullets[i].position.x) >= 30 || Math.abs(bullets[i].position.y) >= 30
			|| Math.abs(bullets[i].position.z) >= 30)
		{
			to_delete_bullets.push(bullets[i]);
			to_delete_direct.push(direct[i]);
		}
		else
		{
			temp_save_bullets.push(bullets[i]);
			temp_save_direct.push(direct[i]);
		}
	}

	for(var i = 0; i < to_delete_bullets.length; i++)
	{
		scene.remove(to_delete_bullets[i]);
	}
	while(to_delete_bullets.length > 0)
	{
		to_delete_bullets.shift();
		to_delete_direct.shift();
	}

	bullets = [];
	direct = [];

	for(var i = 0; i < temp_save_bullets.length; i++)
	{
		bullets.push(temp_save_bullets[i]);
		direct.push(temp_save_direct[i]);
	}
			
	for(var i = 0; i < bullets.length; i++)
	{
		bullets[i].position.x += 0.5 * direct[i].x;
		bullets[i].position.y += 0.5 * direct[i].y;
		bullets[i].position.z += 0.5 * direct[i].z;

		var isShooton = false;
		var j = 0;
		
		for(j = 0; j < ghosts_up.length; j++)
		{
			if(isShooted(bullets[i], ghosts_up[j], i))
			{
				isShooton = true;
				break;
			}
		}	
		if(isShooton == true)
		{
			ghost_killed(ghosts_up[j]);
			bullets[i].position.x = 50;
		}			
	}
}
 
var render = function () {
	//cubeperson_model.position.copy(cube.position);
	//cubeperson_model.updateCubeMap(renderer, scene);		

	if(person_model != null)
	{
		ghost_bite();
		if(hp < 0)
		{				
			clearScene();
			isGameOver = true;
			$('.grids').remove();
			$('#heropoint').hide();						
			$('#hp_bar').hide();
			$('#endpage').show();
			$('#leftpoint').hide();
			return;
		}

		person_model_move_xz();

		person_model_move_y();

		document.getElementById('heropoint').style.top = 15 * mapsize * (person_model.position.z + cube_side_length * (mapsize / 2)) / (cube_side_length * mapsize) + 'px';

		document.getElementById('heropoint').style.left = 15 * mapsize * (person_model.position.x + cube_side_length * (mapsize / 2)) / (cube_side_length * mapsize) + 'px';

		for(var i = 0; i < ghosts_pos_point.length; i++)
		{
			ghosts_pos_point[i].style.top = 15 * mapsize * (ghosts_up[i].position.z + cube_side_length * (mapsize / 2)) / (cube_side_length * mapsize) + 'px';

			ghosts_pos_point[i].style.left = 15 * mapsize * (ghosts_up[i].position.x + cube_side_length * (mapsize / 2)) / (cube_side_length * mapsize) + 'px';
		}
	}

	bullet_move();

	ghostMoving();

	$('#hp_bar').css('width', (hp / hp_all) * document.body.clientWidth);
	$('#hp_bar').css('left', (document.body.clientWidth - (hp / hp_all) * document.body.clientWidth) / 2);
	
	requestAnimationFrame(render);

	if(isGameOver == true)
	{
		return;
	}

	renderer.render(scene, camera);	
};		

//确定地雷位置			
function creatBomb()
{
	var i, j, num = 0;
	var pos = new Array();
	for(i = 0; i < 20; i++)
	{
		pos[i] = new Array();
		for(j = 0; j < 20; j++)
		{
			pos[i][j] = Math.floor(Math.random() * 3);
		}				
	}
	for(i = 0; i < 20; i++)
	{
		for(j = 0; j < 20; j++)
		{
			if(pos[i][j] == 0)
			{
				num++;
			}
		}
	}

	bombnum = num;
	leftnum = 400 - num;
	$('#leftnum').html("剩余宝藏数: " + leftnum);

	if(num < 50)
	{
		return creatBomb();
	}
	else
	{
		bombhascreated = true;
		return pos;
	}
}			

//2D地图	(-10, 0, -10)对应左上角点		
function two_dim_map_create()
{
	two_dim_map_list = new Array();

	for(var i = 0; i < mapsize; i++)
	{
		two_dim_map_list[i] = new Array();
		for(var j = 0; j < mapsize; j++)
		{
			two_dim_map_list[i][j] = null;
		}				
	}

	for(var i = 0; i < 20; i++)
	{
		for(var j = 0; j < 20; j++)
		{
			var newDiv = document.createElement("div");
			var newSpan = document.createElement("span");
			newSpan.innerHTML = "";
			newSpan.style.cssText = "font-size:8px;text-align:center;";
			newDiv.appendChild(newSpan);
			newDiv.style.cssText = "width: 15px;height: 15px;border: 1px solid black;position: absolute;left:" + i * 15 + "px;top: " + j * 15 + "px;margin: 0px;padding: 0px;text-align:center;";
			newDiv.setAttribute('class', 'grids');
			document.body.appendChild(newDiv);
			two_dim_map_list[i][j] = newSpan;
		}
	}
}					

//判断周围有多少雷
function displayPos()//展示周围没有地雷的区域
{
	var row = arguments[0];
	var col = arguments[1];
	var count = 0;

	if(row + 1 < mapsize && col + 1 < mapsize)
	{
		if(bomb_map[row + 1][col + 1] == 0)
		{
			count++;
		}
	}
	if(col + 1 < mapsize)
	{
		if(bomb_map[row][col + 1] == 0)
		{
			count++;
		}
	}
	if(row - 1 >= 0 && col + 1 < mapsize)
	{
		if(bomb_map[row - 1][col + 1] == 0)
		{
			count++;
		}
	}
	if(row - 1 >= 0 && col - 1 >= 0)
	{
		if(bomb_map[row - 1][col - 1] == 0)
		{
			count++;
		}
	}
	if(col - 1 >= 0)
	{
		if(bomb_map[row][col - 1] == 0)
		{
			count++;
		}
	}
	if(row + 1 < mapsize && col - 1 >= 0)
	{
		if(bomb_map[row + 1][col - 1] == 0)
		{
			count++;
		}
	}
	if(row - 1 >= 0)
	{
		if(bomb_map[row - 1][col] == 0)
		{
			count++;
		}
	}
	if(row + 1 < mapsize)
	{
		if(bomb_map[row + 1][col] == 0)
		{
			count++;
		}
	}

	return count;
}


//碰撞检测
function find_min_x()
{
	var pos_1 = arguments[0];
	var pos_2 = arguments[1];
	var pos_3 = arguments[2];
	var pos_4 = arguments[3];
	var new_min = new THREE.Vector3(0, 0, 0);

	if(pos_1.x < pos_2.x)
	{
		if(pos_1.x < pos_3.x)
		{
			if(pos_1.x < pos_4.x)
			{
				new_min.x = pos_1.x;
			}
			else
			{
				new_min.x = pos_4.x;
			}
		}
		else
		{
			if(pos_3.x < pos_4.x)
			{
				new_min.x = pos_3.x;
			}
			else
			{
				new_min.x = pos_4.x;
			}
		}
	}
	else
	{
		if(pos_2.x < pos_3.x)
		{
			if(pos_2.x < pos_4.x)
			{
				new_min.x = pos_2.x;
			}
			else
			{
				new_min.x = pos_4.x;
			}
		}
		else
		{
			if(pos_3.x < pos_4.x)
			{
				new_min.x = pos_3.x;
			}
			else
			{
				new_min.x = pos_4.x;
			}
		}
	}

	return new_min.x;
}

function find_min_z()
{
	var pos_1 = arguments[0];
	var pos_2 = arguments[1];
	var pos_3 = arguments[2];
	var pos_4 = arguments[3];
	var new_min = new THREE.Vector3(0, 0, 0);

	if(pos_1.z < pos_2.z)
	{
		if(pos_1.z < pos_3.z)
		{
			if(pos_1.z < pos_4.z)
			{
				new_min.z = pos_1.z;
			}
			else
			{
				new_min.z = pos_4.z;
			}
		}
		else
		{
			if(pos_3.z < pos_4.z)
			{
				new_min.z = pos_3.z;
			}
			else
			{
				new_min.z = pos_4.z;
			}
		}
	}
	else
	{
		if(pos_2.z < pos_3.z)
		{
			if(pos_2.z < pos_4.z)
			{
				new_min.z = pos_2.z;
			}
			else
			{
				new_min.z = pos_4.z;
			}
		}
		else
		{
			if(pos_3.z < pos_4.z)
			{
				new_min.z = pos_3.z;
			}
			else
			{
				new_min.z = pos_4.z;
			}
		}
	}

	return new_min.z;
}

function find_max_x()
{
	var pos_1 = arguments[0];
	var pos_2 = arguments[1];
	var pos_3 = arguments[2];
	var pos_4 = arguments[3];
	var new_max = new THREE.Vector3(0, 0, 0);

	if(pos_1.x > pos_2.x)
	{
		if(pos_1.x > pos_3.x)
		{
			if(pos_1.x > pos_4.x)
			{
				new_max.x = pos_1.x;
			}
			else
			{
				new_max.x = pos_4.x;
			}
		}
		else
		{
			if(pos_3.x > pos_4.x)
			{
				new_max.x = pos_3.x;
			}
			else
			{
				new_max.x = pos_4.x;
			}
		}
	}
	else
	{
		if(pos_2.x > pos_3.x)
		{
			if(pos_2.x > pos_4.x)
			{
				new_max.x = pos_2.x;
			}
			else
			{
				new_max.x = pos_4.x;
			}
		}
		else
		{
			if(pos_3.x > pos_4.x)
			{
				new_max.x = pos_3.x;
			}
			else
			{
				new_max.x = pos_4.x;
			}
		}
	}

	return new_max.x;
}

function find_max_z()
{
	var pos_1 = arguments[0];
	var pos_2 = arguments[1];
	var pos_3 = arguments[2];
	var pos_4 = arguments[3];
	var new_max = new THREE.Vector3(0, 0, 0);

	if(pos_1.z > pos_2.z)
	{
		if(pos_1.z > pos_3.z)
		{
			if(pos_1.z > pos_4.z)
			{
				new_max.z = pos_1.z;
			}
			else
			{
				new_max.z = pos_4.z;
			}
		}
		else
		{
			if(pos_3.z > pos_4.z)
			{
				new_max.z = pos_3.z;
			}
			else
			{
				new_max.z = pos_4.z;
			}
		}
	}
	else
	{
		if(pos_2.z > pos_3.z)
		{
			if(pos_2.z > pos_4.z)
			{
				new_max.z = pos_2.z;
			}
			else
			{
				new_max.z = pos_4.z;
			}
		}
		else
		{
			if(pos_3.z > pos_4.z)
			{
				new_max.z = pos_3.z;
			}
			else
			{
				new_max.z = pos_4.z;
			}
		}
	}

	return new_max.z;
}

function isCrashed()
{
	var myobject = arguments[0];
	var otherobject = arguments[1];

	var pos_1 = new THREE.Vector3(0, 0, 0);
	var pos_2 = new THREE.Vector3(0, 0, 0);
	var pos_3 = new THREE.Vector3(0, 0, 0);
	var pos_4 = new THREE.Vector3(0, 0, 0);

	var half_x = (myobject.geometry.boundingBox.max.x - myobject.geometry.boundingBox.min.x) / 2;
	var half_y = (myobject.geometry.boundingBox.max.y - myobject.geometry.boundingBox.min.y) / 2;
	var half_z = (myobject.geometry.boundingBox.max.z - myobject.geometry.boundingBox.min.z) / 2;

	var my_dir_z = myobject.getWorldDirection();
	my_dir_z.multiplyScalar(half_z);

	var my_dir_x = myobject.getWorldDirection().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);;
	my_dir_x.multiplyScalar(half_x);

	pos_1.x = my_dir_x.x + my_dir_z.x + myobject.position.x;
	pos_1.z = my_dir_x.z + my_dir_z.z + myobject.position.z;

	pos_2.x = my_dir_x.x - my_dir_z.x + myobject.position.x;
	pos_2.z = my_dir_x.z - my_dir_z.z + myobject.position.z;

	pos_3.x = -1 * my_dir_x.x + my_dir_z.x + myobject.position.x;
	pos_3.z = -1 * my_dir_x.z + my_dir_z.z + myobject.position.z;

	pos_4.x = -1 * my_dir_x.x - my_dir_z.x + myobject.position.x;
	pos_4.z = -1 * my_dir_x.z - my_dir_z.z + myobject.position.z;

	var mybox = new THREE.Box3(new THREE.Vector3(find_min_x(pos_1, pos_2, pos_3, pos_4), myobject.position.y + myobject.geometry.boundingBox.min.y, find_min_z(pos_1, pos_2, pos_3, pos_4)), new THREE.Vector3(find_max_x(pos_1, pos_2, pos_3, pos_4), myobject.position.y + myobject.geometry.boundingBox.max.y, find_max_z(pos_1, pos_2, pos_3, pos_4)));

	var other_dir_z = otherobject.getWorldDirection();
	other_dir_z.multiplyScalar(half_z);

	var other_dir_x = otherobject.getWorldDirection().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);;
	other_dir_x.multiplyScalar(half_x);

	pos_1.x = other_dir_x.x + other_dir_z.x + otherobject.position.x;
	pos_1.z = other_dir_x.z + other_dir_z.z + otherobject.position.z;

	pos_2.x = other_dir_x.x - other_dir_z.x + otherobject.position.x;
	pos_2.z = other_dir_x.z - other_dir_z.z + otherobject.position.z;

	pos_3.x = -1 * other_dir_x.x + other_dir_z.x + otherobject.position.x;
	pos_3.z = -1 * other_dir_x.z + other_dir_z.z + otherobject.position.z;

	pos_4.x = -1 * other_dir_x.x - other_dir_z.x + otherobject.position.x;
	pos_4.z = -1 * other_dir_x.z - other_dir_z.z + otherobject.position.z;

	var otherbox = new THREE.Box3(new THREE.Vector3(find_min_x(pos_1, pos_2, pos_3, pos_4), otherobject.position.y + otherobject.geometry.boundingBox.min.y, find_min_z(pos_1, pos_2, pos_3, pos_4)), new THREE.Vector3(find_max_x(pos_1, pos_2, pos_3, pos_4), otherobject.position.y + otherobject.geometry.boundingBox.max.y, find_max_z(pos_1, pos_2, pos_3, pos_4)));

	if(mybox.intersectsBox(otherbox))
	{				
		return true;
	}
	
	return false;
}

function isShooted()
{
	var bullet = arguments[0];
	var ghost = arguments[1];
	var index = arguments[2];

	var bulletBox = bullet.geometry.boundingSphere.getBoundingBox();

	var pos_1 = new THREE.Vector3(0, 0, 0);
	var pos_2 = new THREE.Vector3(0, 0, 0);
	var pos_3 = new THREE.Vector3(0, 0, 0);
	var pos_4 = new THREE.Vector3(0, 0, 0);

	var half_x = (ghost.geometry.boundingBox.max.x - ghost.geometry.boundingBox.min.x) / 2;
	var half_y = (ghost.geometry.boundingBox.max.y - ghost.geometry.boundingBox.min.y) / 2;
	var half_z = (ghost.geometry.boundingBox.max.z - ghost.geometry.boundingBox.min.z) / 2;

	var my_dir_z = ghost.getWorldDirection();
	my_dir_z.multiplyScalar(half_z);

	var my_dir_x = ghost.getWorldDirection().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);;
	my_dir_x.multiplyScalar(half_x);

	pos_1.x = my_dir_x.x + my_dir_z.x + ghost.position.x;
	pos_1.z = my_dir_x.z + my_dir_z.z + ghost.position.z;

	pos_2.x = my_dir_x.x - my_dir_z.x + ghost.position.x;
	pos_2.z = my_dir_x.z - my_dir_z.z + ghost.position.z;

	pos_3.x = -1 * my_dir_x.x + my_dir_z.x + ghost.position.x;
	pos_3.z = -1 * my_dir_x.z + my_dir_z.z + ghost.position.z;

	pos_4.x = -1 * my_dir_x.x - my_dir_z.x + ghost.position.x;
	pos_4.z = -1 * my_dir_x.z - my_dir_z.z + ghost.position.z;

	var mybox = new THREE.Box3(new THREE.Vector3(find_min_x(pos_1, pos_2, pos_3, pos_4), ghost.position.y + ghost.geometry.boundingBox.min.y, find_min_z(pos_1, pos_2, pos_3, pos_4)), new THREE.Vector3(find_max_x(pos_1, pos_2, pos_3, pos_4), ghost.position.y + ghost.geometry.boundingBox.max.y, find_max_z(pos_1, pos_2, pos_3, pos_4)));

	var bullet_dir_z = new THREE.Vector3(direct[index].x, direct[index].y, direct[index].z);
	bullet_dir_z.multiplyScalar(bullet.geometry.boundingSphere.radius);

	var bullet_dir_x = (new THREE.Vector3(direct[index].x, direct[index].y, direct[index].z)).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
	bullet_dir_x.multiplyScalar(bullet.geometry.boundingSphere.radius);

	pos_1.x = bullet_dir_x.x + bullet_dir_z.x + bullet.position.x;
	pos_1.z = bullet_dir_x.z + bullet_dir_z.z + bullet.position.z;

	pos_2.x = bullet_dir_x.x - bullet_dir_z.x + bullet.position.x;
	pos_2.z = bullet_dir_x.z - bullet_dir_z.z + bullet.position.z;

	pos_3.x = -1 * bullet_dir_x.x + bullet_dir_z.x + bullet.position.x;
	pos_3.z = -1 * bullet_dir_x.z + bullet_dir_z.z + bullet.position.z;

	pos_4.x = -1 * bullet_dir_x.x - bullet_dir_z.x + bullet.position.x;
	pos_4.z = -1 * bullet_dir_x.z - bullet_dir_z.z + bullet.position.z;

	var bulletbox = new THREE.Box3(new THREE.Vector3(find_min_x(pos_1, pos_2, pos_3, pos_4), bullet.position.y + bulletBox.min.y, find_min_z(pos_1, pos_2, pos_3, pos_4)), new THREE.Vector3(find_max_x(pos_1, pos_2, pos_3, pos_4), bullet.position.y + bulletBox.max.y, find_max_z(pos_1, pos_2, pos_3, pos_4)));

	return mybox.intersectsBox(bulletbox);
}

function clearScene()
{
	if(isGameOver == false)
	{
		while(scene.children.length != 0)
		{
			scene.remove(scene.children[0]);
		}
		while(ghosts_pos_point.length != 0)
		{
			var t = ghosts_pos_point.shift();
			document.body.removeChild(t);
		}

		bullets = [];
		direct = [];
		ghost_timer = null;
		ghosts_up = [];
		ghosts_rising = [];
		ghosts_pos_point = [];
		cubes = [];
		jumping_time = [];
		isJumping = [];
		jump_dis = [];

		document.body.removeChild(renderer.domElement);
	}		
}