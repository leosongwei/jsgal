let script_dolist;
let program_counter = 0;
let tag_hash;
let handling_option_p = false;

function prompt_state(state_string)
{
  console.log("prompt_state: " + state_string);
  document.getElementById("state").innerHTML = state_string;
}

// "0123456".substring(1,3)

function parse_sexp(string){
	// without the outer parenthese
	let sexp = new Array();
	let collect = new String();

	let lexp = 0; let lstr = 1; let lquote = 2;
	let state = lexp; // exp, str, quote(quote string)

	err_func = function(err_string){
			prompt_state(err_string);
			return err_string;
	};

	for(let i=0; i<string.length; i++){
		let ch = string[i];
		switch(state){
		case lexp: // expression
			if(ch == " "){
				state = lexp;
			}else if(ch == "("){
				state = lexp;
				let level = 0;
				let quotep = false;
				for(let j=0; j+i<string.length; j++){
					let r = string[j+i];
					if(r == "\""){
						quotep = !quotep;
					}else if(r == "(" && !quotep){
						level++;
					}else if(r == ")" && !quotep){
						level--;
						if(level == 0){
							sexp.push(parse_sexp(string.substring(i+1, j+i)));
							i = i+j;
							break;}}}
				if(level != 0)
					return(err_func("SEXP-PARSER-UNBALANCED-PARENTHESE"));
			}else if(ch == "\""){
				state = lquote;
			}else if(ch == ")"){
				return(err_func("SEXP-PARSER-UNEXPECTED-RIGHT-PAREN"));
			}else{
				state = lstr;
				collect = collect + ch;
			}
			break;
		case lstr: // string
			if(ch == " "){
				state = lexp;
				sexp.push(collect);
				collect = new String();
			}else	if(ch == "("){
				state = lexp;
				sexp.push(collect);
				collect = new String();
				i--;
			}else if(ch == "\""){
				return(err_func("SEXP-PARSER-UNEXPECTED-QUOTE:" + string + "," + i));
			}else if(ch == ")"){
				return(err_func("SEXP-PARSER-UNEXPECTED-RIGHT-PAREN"));
			}else{
				collect = collect + ch;
			}
			break;
		case lquote: //quoted string
			if(ch == "\""){
				state = lexp;
				sexp.push(collect);
				collect = new String();
			}else{
				collect = collect + ch;
			}
			break;
		default:
			return(err_func("SEXP-PARSER-UNKNOWN-ERROR"));
			break;
		}
		// good
	}

	if(state == lstr){
		sexp.push(collect);
	}

	return sexp;
}

function check_opt_command(sexp){
	if(!(sexp.length>=2))
		return false;
	let option_list = sexp.slice(1);
	for(let i=0; i<option_list.length; i++){
		let option = option_list[i];
		if(option.length != 2)
			return false;
		if((typeof option[0]) != "string")
			return false;
		if(!Array.isArray(option[1]))
			return false;

		let behaviour = option[1];

		if(behaviour.length != 2)
			return false;
		if((typeof behaviour[0]) != "string")
			return false;
		if((typeof behaviour[1]) != "string")
			return false;
	}
	return true;
}

function parse_line(line, callback_err)
{
	// empty line
	if(line.length == 0)
		return;
	// comment
	if(line[0] == "#")
		return;

	let line_sexp = parse_sexp(line);

	// sanity check
	switch(line_sexp[0]){
		case "dia":
			if(!(line_sexp.length >= 3)){
				callback_err("Invalid dialogue command.");
				return;
			}
			break;
		case "tag":
			if(line_sexp.length != 2){
				callback_err("Invalid tag.");
				return;
			}
			break;
		case "opt":
			if(!check_opt_command(line_sexp)){
				callback_err("Invalid options.");
				return;
			}
			break;
		case "txt":
			if(line_sexp.length != 2){
				callback_err("Invalid loading command.");
				return;
			}
			break;
		case "goto":
			if(line_sexp.length != 2){
				callback_err("Invalid loading command.");
				return;
			}
			break;
		default:
			// ignore
			return;
			break;
	}
	return(line_sexp);
}

function parse_dolist_f(script_string)
{
	prompt_state("Parsing lines...");
  let splited = script_string.split("\n");
  let stripped = new Array();
	let line_num = 0;
	let count = 0;

	err_func = function(err_string){
		prompt_state("Parsing error, line: " + line_num + ", err: " + err_string);
	};

  for(let i=0; i<splited.length; i++){
		let line_sexp = parse_line(splited[i]);
		if(Array.isArray(line_sexp)){
			stripped.push(line_sexp);
			count++;
		}
		line_num++;
  }
  script_dolist = stripped;
	prompt_state("Parsing complete, " + count + " items.");
	return count;
}

function show_txt()
// for debug
{
  for(let i=0; i<script_dolist.length; i++){
    var para = document.createElement("p");
    para.innerHTML = script_dolist[i];
    document.getElementById("log").appendChild(para);
  }
}

// script_url: './foo.txt'
function load_script(script_url, callback)
{
	prompt_state("Downloading script file...");
	let client = new XMLHttpRequest();
	client.open('GET', script_url);
	client.onreadystatechange = function() {
		if(client.readyState == 4){
			callback(client.responseText);
		}
	};
	client.send();
}

function tag_hashing_f()
{
	tag_hash = new Array();
	for(let i=0; i<script_dolist.length; i++){
		line_sexp = script_dolist[i];
		if(line_sexp[0] == "tag"){
			tag_hash[line_sexp[1]] = i;
		}
	}
}



function handle_opt(line_sexp)
{
	prompt_state("handling options...");
	handling_option_p = true;

	let option_list = document.createElement("ul");

	let disable_list = function(string){
		option_list.innerHTML = ""; // clear options
		let selected_option = document.createElement("li");
		selected_option.innerHTML = string;
		option_list.appendChild(selected_option);
	}

	let options = line_sexp.slice(1);
	options.forEach(function(option){
		prompt_state(option[0]);
		let item = document.createElement("li");
		let button = document.createElement("button")
		button.innerHTML = option[0];
		button.onclick = function(){
			disable_list(option[0]);
			let behaviour = option[1];
			switch(behaviour[0]){
				case "tag":
					program_counter = tag_hash[behaviour[1]];
					handling_option_p = false;
					fetch_command_and_eval();
					break;
				default:
					prompt_state("handle_opt():error, unknown behaviour;")
					break;
			}
		};
		item.appendChild(button);
		option_list.appendChild(item);
	});
	document.getElementById("dialog").appendChild(option_list);
}

function evaluate_command(line_sexp){
	switch(line_sexp[0]){
		case "dia":
			let para = document.createElement("p");
			para.innerHTML = line_sexp[1] + ": " + line_sexp[2];
			document.getElementById("dialog").appendChild(para);
			return "dia";
			break;
		case "tag":
			return "tag";
			break;
		case "goto":
			program_counter = tag_hash[line_sexp[1]];
			return "goto";
			break;
		case "opt":
			handle_opt(line_sexp);
			return "opt";
			break;
		default:
			prompt_state("evaluate_command(): error: unknown command: "
				+ line_sexp[0]);
			break;
			return "unknown";
	}
}

function fetch_command_and_eval(){
	if(program_counter >= script_dolist.length) return;
	let flag = true;
	while(flag){
		let line_sexp = script_dolist[program_counter];
		switch(evaluate_command(line_sexp)){
			case "dia":
				break;
			case "goto":
			case "tag":
				program_counter++;
				continue;
			case "opt":
				break;
			default:
				break;
		}
		flag = false;
	}
	program_counter++;
}

function init_keyboard()
{
	window.addEventListener("keydown", function(event){
		if (event.defaultPrevented) {
			return; // Do nothing if the event was already processed
		}

		prompt_state("keyboard: " + event.key);
		switch(event.key){
			case "Enter":
				if(!handling_option_p)
					fetch_command_and_eval();
				break;
			default:
				break;
		}

		// Cancel the default action to avoid it being handled twice
		event.preventDefault();
	}, true);
}

loader = function(){
	load_script("./test.txt", function(string){
		prompt_state("Script download complete!");
		parse_dolist_f(string);
		//show_txt();
		tag_hashing_f();
		init_keyboard();
	});
};
