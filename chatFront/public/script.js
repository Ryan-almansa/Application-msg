document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const userList = document.getElementById('user-list');
    const creerBtn = document.getElementById("creer");
    const connexionBtn = document.getElementById("connexion");

    let users = []; // Liste des utilisateurs initialement vide


    /*⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣤⣤⣤⣤⣶⣶⣶⣶⣶⣶⣶⣦⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣴⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⠿⠿⠿⠿⣿⣿⣷⣶⣶⣤⣤⣄⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣾⣿⢿⡿⠛⢋⣩⣽⠿⠿⠛⠛⢛⣛⣉⣉⣙⣛⣓⣒⠒⠠⠀⢀⠀⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣤⣤⣤⣤⣤⣤⣤⣀⣀⣀⠀⠀⠀⢀⣀⠻⢿⣿⣿⣿⣿⣿⣶⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⡿⣿⡿⣿⠟⠁⣠⠞⠋⢁⣠⣴⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣒⡂⠒⠢⠤⣤⣀⣀⣀⣀⣀⠀⣀⠀⢀⣀⣠⣤⣴⠾⠟⠛⣛⣉⣉⣩⣭⣤⣭⠉⠉⠛⠻⢿⣿⣓⠲⠤⠀⡉⠑⠻⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⡿⢋⣼⣧⢤⠊⠀⡠⠞⠛⠋⠉⠁⢀⣀⣀⣀⣀⣀⠀⠀⠉⠙⠓⠾⢭⣝⣛⠶⣦⣄⣠⣭⠽⣛⣿⠿⣿⣛⣫⡽⢛⣭⢔⣠⠴⠾⠟⠿⠿⠶⣤⣬⣭⣝⣓⡦⢄⠂⢤⡉⠛⠶⣄⠀⠰⣄⠀⠹⣯⠽⣿⣿⣿⣮⣽⣿⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⡿⢁⣼⣿⣴⠞⠑⠁⠀⡀⠤⠒⢋⣩⣽⣿⣿⣿⣿⣹⣻⣿⣶⣦⣄⠐⠢⢤⣍⣙⠓⠮⣍⡓⠄⣐⡾⠿⢻⣿⣥⠞⣫⡶⢟⣡⣴⣶⣿⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣶⣄⣙⠳⣦⡀⠑⠄⠹⣷⣤⡛⠑⣄⢻⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣱⡟⣽⣿⡟⣜⠀⢀⣞⣤⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣄⡉⠙⠻⠿⢶⣾⣬⣅⣀⣤⣞⢋⣥⠞⠋⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣮⣿⣷⣄⠠⡘⣿⣷⠀⣘⣷⣿⣿⡿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⡿⣿⣿⣱⢃⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣖⣛⣿⠛⠾⣍⠉⢀⣔⣽⣣⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠈⢷⡀⢈⢿⣿⣻⢳⣽⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⡟⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣭⣿⣓⣶⣼⡏⣿⢏⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣿⣧⢢⡹⣿⣿⡆⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⡟⣱⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⣹⡿⢷⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣇⠹⣿⣇⢸⡟⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣯⣴⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣷⣿⣹⣿⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢳⣿⣿⣾⣿⣿⣿⣿⣷⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⢀⣲⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣽⣿⣶⣿⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢻⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⢸⣿⣿⣿⣿⣿⣿⣿⣿⣷⡄⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⣰⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣇⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⣿⢟⣯⣭⣝⣚⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣮⣵⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀
    ⠀⠀⠀⠀⣴⣿⣿⣿⡿⠛⣡⡴⠛⣩⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠗⣻⠷⣿⠀⠤⠤⢍⡛⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣸⣿⣿⣉⡉⢻⣿⣿⣿⣿⣿⣧⡀⠀⠀⠀
    ⠀⠀⠀⣾⣿⢫⡾⢁⣴⣟⣁⣀⣰⠷⠛⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⡿⠉⠁⠀⠀⠀⠀⠰⡀⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⠿⣿⡿⣟⡛⠿⣧⠻⣷⣮⡙⢿⣿⣇⠀⠀⠀
    ⠀⠀⣼⣿⣷⣫⣶⠟⣹⠟⢛⣿⡿⣾⣓⣶⣄⣈⣿⠿⣝⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠛⢿⢿⣿⢃⠀⠀⠀⠀⠀⠀⢀⣿⣿⣷⢸⠷⣽⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠉⠀⠉⢁⣀⣈⣀⡀⠀⠙⠂⠈⢷⡘⢿⣷⡌⢿⣿⡄⠀⠀
    ⠀⢸⣿⣿⣿⡿⠁⣼⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡿⣦⣝⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⠀⠀⠀⠀⢘⠊⠃⠁⠀⠀⠀⠀⠀⢸⣼⣟⠇⠀⠀⠀⠉⠻⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠩⢴⣶⡶⣶⣟⣿⣿⣿⣿⣿⣿⣷⣤⣄⠀⠀⠻⣄⠻⣿⠈⣿⣿⡆⠀
    ⠀⣿⣿⣿⣿⠂⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⣻⡏⠀⣀⣀⠀⠀⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡉⠀⠀⠀⠀⠀⠀⢿⡯⢿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠋⢀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠘⣧⠙⣧⠸⣿⣷⠀
    ⠀⣿⡿⣿⠏⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣉⠛⠿⣿⡿⢿⣿⡿⠿⣋⣩⣵⣶⡿⣇⡈⠿⣿⣿⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣧⣠⣾⣿⣿⡷⢀⡼⠳⢤⣼⣿⣋⣉⣉⣁⣤⣤⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠘⣧⠹⣇⣿⣿⠀
    ⠀⣿⡇⣿⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣶⣬⣩⣭⣥⣤⣬⣭⣽⣿⣯⣤⣌⡙⠛⠛⣿⣿⣷⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⣹⣿⣿⣿⠟⠁⣀⣤⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⣿⢿⣿⡿⢿⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀⠸⡇⢿⣼⣿⡀
    ⠠⢿⡇⡿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⣼⠙⣹⠫⠿⣿⣻⢿⡿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿⣏⠓⠦⣄⣀⣀⡤⣶⣤⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⡿⡟⣿⣿⠿⣿⣿⢿⡇⢻⡟⠈⣿⣙⣹⡇⣈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⣿⢸⣿⣿⡇
    ⠀⣾⣿⣷⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢻⣿⣿⣿⣿⣿⣷⢿⠤⣤⡏⠁⣿⠁⣾⠁⢫⢿⣿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣤⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣿⣿⠙⠃⠹⣷⠀⢿⡏⠀⣷⣠⣷⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⢸⣾⢹⣿⠃
    ⠀⢀⣿⣿⠀⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣿⣧⣮⣜⡏⣰⣦⣿⣀⡇⠀⠃⡿⠋⠈⡼⣿⡿⢡⢳⢹⣿⣿⣿⣿⡿⠹⠉⠿⡏⣿⣿⣿⣿⣿⡿⡿⠃⠀⠈⠻⣿⣿⢿⠿⠋⠃⠈⠓⢹⡄⠀⠀⢻⠀⠸⡇⣠⣿⠿⣿⣿⣾⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⢸⡇⣼⣿⠀
    ⠀⠀⠻⣿⣧⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣧⣿⣿⣷⣤⣸⠁⠀⠀⠁⣿⠁⠀⠘⢸⣿⣿⠛⠹⠀⠀⠀⠀⠀⠈⠧⢻⣿⠛⠀⠃⠀⠀⠀⠀⠛⢻⡎⠀⠀⠀⠀⠀⠸⡇⠀⠀⢸⠇⣠⣿⣿⣿⣷⠻⣮⣉⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⢸⣇⣿⡟⠀
    ⠀⠀⠀⢻⣿⡆⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣼⣿⣿⣿⣿⣿⡿⣿⣿⣿⣷⣄⠀⢀⡟⠀⠀⠁⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⡇⠀⠀⢸⣿⣿⣿⣯⣱⣆⣣⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⡾⣸⣿⠇⠀
    ⠀⠀⠀⠈⠛⣿⡄⠀⠘⡟⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣏⣿⣿⠿⣿⢷⣤⣧⠀⠀⠀⠀⠸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠈⡇⠀⠀⣀⣀⣀⣀⣇⣠⣴⠿⢻⢱⠀⡘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢃⣾⠃⣿⡟⠀⠀
    ⠀⠀⠀⠀⠀⠀⠙⢦⣀⠸⡄⠟⣇⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣰⠁⣘⡟⣿⣷⣶⣦⣤⣴⣧⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣿⣤⣴⣶⣶⣶⣾⣿⣿⣿⣿⣿⣿⠻⡟⣿⢛⠛⡏⢻⣤⣼⣾⣷⣿⣿⣿⣿⣿⣿⣿⣧⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠃⣰⠏⠈⣼⠇⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠉⠳⢽⣧⣽⣦⡹⣿⣌⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣧⣣⣿⢹⣿⢋⣿⢻⢿⣿⠿⢹⠙⡏⣿⠛⡏⠟⡏⡍⡏⡏⢫⢹⠈⢹⠰⠸⠀⢹⣧⠃⣷⣼⣾⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢿⣿⣿⣿⣿⠟⠁⣠⡟⠀⣴⠏⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⣷⡈⠉⠛⢶⣿⣿⣿⡿⣿⣿⣿⣿⣯⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣼⣿⣼⣾⣿⣸⣸⡆⣷⣸⡀⡇⡆⡇⣡⣧⣇⢸⣸⢸⢸⣆⣶⣷⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⣿⣿⣿⣿⣿⠏⣠⣿⣿⣿⡿⡃⢀⣴⠟⣀⠜⠁⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠩⠻⣿⡌⠶⣄⠈⠛⢯⡿⣿⣿⣿⣿⣿⣿⣿⢿⣿⢿⣿⣿⡇⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⣿⣧⣿⣿⣿⣿⣿⡟⣠⣿⣿⡿⣻⣟⣰⣿⣯⡾⠃⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢌⣿⣶⣌⠳⣦⣀⠉⠊⠛⢿⡿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣾⣿⠋⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⠟⣿⠉⣿⣿⣿⣿⣿⡟⡇⢹⣸⣾⣿⣿⣿⣿⣿⣿⣿⢿⣿⣿⣿⣵⣿⣿⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢻⢻⢿⣶⣽⣷⣦⣀⠑⢷⣌⠙⢿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣶⣿⣿⣿⡟⡏⣿⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⡟⡿⠉⢋⠈⢀⢸⣦⣿⣿⡿⣿⡿⢀⣿⣿⣿⣿⣿⣿⣿⡿⣿⢿⣵⡿⣱⣿⣿⣿⣿⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢧⠙⢻⣿⣿⣿⢷⣄⡙⢧⣄⠈⠻⣿⣿⣿⣿⣿⣿⡿⣿⣿⣿⣿⣇⡇⣯⡁⠈⣏⡇⢿⢸⠁⢹⠉⣿⡇⣿⡏⡟⡏⡏⡏⣷⠁⠀⡇⡄⢠⣸⣿⡿⢿⢣⣿⣷⣿⣿⣿⣿⣿⣿⣿⡿⠟⢁⠞⣡⣾⣿⣿⣿⣿⢯⣾⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣦⣀⠻⣿⣿⣟⣿⣦⠙⣦⡀⠈⢿⣽⠻⣿⣿⣿⣿⣿⣯⡹⣿⢻⣿⣿⣧⣿⣇⢸⠀⠀⠸⠀⢹⠃⢸⡇⣇⡇⡇⠁⣿⢸⣀⣷⣼⣿⣿⣿⡴⢟⣵⣿⣿⣿⣿⣿⡿⠋⠉⠁⣠⡴⠋⣴⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠈⠻⣄⠘⣿⣿⣿⣿⣷⡈⣷⠀⠀⢻⣇⢸⡻⢿⣿⣿⣿⣿⣿⣧⣽⣟⣿⣿⣿⣿⣿⣧⣴⣶⣾⣴⣦⣿⣿⣷⣿⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣽⠋⠀⢠⣴⠛⠁⢀⣾⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠌⡢⠈⢻⣻⣿⣞⣷⡘⣧⠀⠀⢿⣎⣧⠀⣿⠛⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⣿⠛⠛⠛⠉⡟⠛⡏⢉⣿⠃⢀⣼⠟⠋⠀⣠⡾⠟⣹⣿⣿⣿⣿⣿⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣧⡀⠙⢟⣿⣿⣧⠹⣇⠀⠈⢿⣿⣆⢻⡀⠀⢀⣷⠀⠀⠹⡇⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠁⢸⡇⠀⠀⡯⠀⠀⠀⣸⡇⣼⢡⣾⠃⠰⠋⠀⠀⣠⡾⠋⢀⣾⣿⣿⣿⡿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢝⢦⡀⠉⠻⣿⣇⢻⡆⠀⠈⢿⣿⣿⣇⣃⢸⣿⡇⠀⠀⣿⠀⠀⠀⠀⠀⠀⠀⢺⠀⠀⠀⠀⠀⠀⠀⢸⠁⠀⢀⡇⠀⠀⢠⡏⣴⣿⡾⢁⠄⠀⠀⣠⣾⡏⠀⣰⣿⣿⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢧⠹⣖⣆⠈⢻⣬⣿⡆⠀⠈⢿⣿⣿⣿⣾⣿⣷⠀⠀⣿⡄⠀⠀⠀⠀⠀⢠⣾⢇⠀⠀⠀⠀⠀⠀⣼⠀⠀⣸⣿⢀⢸⣿⣿⣿⡟⢀⡎⠀⣠⣾⣿⠏⢀⣾⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣺⣧⠈⠺⣧⠀⠙⢿⢿⡄⠀⠈⢿⣿⣿⣿⣿⣿⡆⠀⣿⣷⠀⠀⠀⠀⡆⣼⣿⡆⣦⡀⠀⠀⠀⢀⣿⡆⠀⣿⣿⣮⣿⣿⣿⠏⢠⡾⠀⢠⣿⡿⠃⣰⣿⡿⣻⡿⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢶⣿⣿⣇⠀⠘⡆⠀⠈⢫⣷⠀⠀⠈⢿⣿⣿⣿⣿⣷⣸⣿⣿⣞⡀⠀⡀⣧⣿⣿⣧⣻⣷⣷⣰⡁⢸⣿⣇⣾⣿⣿⣿⣿⣿⠃⢠⣿⠃⣠⣿⠟⠀⣰⡿⢋⣴⣟⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⠿⠿⡄⠀⠘⡄⠈⣦⢻⡇⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿⣿⣿⠇⢀⣾⠎⣴⡿⠃⠀⢀⣾⣶⣿⣿⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠄⠘⢄⠈⢷⣿⣆⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⣼⢏⣼⡟⠁⠀⣰⣿⣿⢿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠰⡀⠀⠣⡈⢳⡿⣷⣄⠀⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⢁⡾⢃⣾⡟⠀⠀⣴⣿⡟⢡⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠣⠀⠀⠈⢄⠹⣏⠻⣷⣄⠀⠈⠻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠉⣰⡿⢡⣾⢿⠁⠀⣼⣿⠏⣰⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠡⡀⠀⠀⠱⡘⢧⡈⠿⣷⠀⠀⠀⠀⠉⠙⠻⠿⠿⠟⠛⠛⠛⠛⠛⠛⠛⠛⠋⠉⠁⠀⢀⡴⠏⢠⣿⣷⠃⠀⣼⣿⠏⡰⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣦⡀⠀⠈⢈⢳⡀⠙⠳⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣤⠶⠋⠀⢰⣿⡿⠃⠀⣸⣿⠏⡠⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣿⣦⠀⠀⠀⠑⠄⠀⠈⠙⠻⠷⠶⠦⠤⠶⠶⠒⠛⠛⠛⠛⠋⠉⠉⠉⠁⠀⠀⣠⠶⠿⠋⠀⠀⣰⡟⠋⠠⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣷⡕⠀⠀⠀⠄⠁⠢⠤⣤⣤⣀⣀⣀⣤⣤⣤⣶⣶⣶⣶⣶⣶⠾⠶⢞⡿⠟⠁⠀⠀⠀⠀⢰⡿⢀⠔⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣦⠀⠀⠀⠀⢀⣀⢀⠙⣿⣿⣿⣯⣷⣾⣿⣿⣿⣿⠿⢋⡼⠞⠉⠀⠀⠀⠀⠀⠀⢠⡿⣵⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⣿⣿⣷⡄⠀⠀⠀⠀⠈⠉⠉⠛⠛⠛⠻⠿⠿⠟⠋⠀⠊⠁⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣷⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠹⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣴⣿⣿⡿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⢿⣿⣶⣦⣤⣤⣀⣀⣀⣀⣀⣀⣀⣀⣤⣶⣿⣿⠿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⢿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠟⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀*/

    // Récupérer les utilisateurs depuis l'API
    async function fetchUsers() {
        try {
            const response = await fetch("http://192.168.65.113:20000/api/getutilisateur");
            if (!response.ok) throw new Error("Erreur lors de la récupération des utilisateurs.");

            const data = await response.json();
            users = data.users;
            updateUserList();

        } catch (error) {
            console.error("Erreur réseau :", error);
        }
    }


    // Récupérer les messages depuis l'API
    function fetchMessages() {
        fetch("http://192.168.65.113:20000/api/recuperation")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des messages.");
                }
                return response.json();
            })
            .then(data => {
                messagesContainer.innerHTML = "";
                data.forEach(msg => {
                    const messageElement = document.createElement("div");
                    messageElement.classList.add("message");
                    messageElement.innerHTML = `<strong>${msg.nom} ${msg.prenom}:</strong> ${msg.contenu} <span class="time">${msg.heure}</span>`;
                    messagesContainer.appendChild(messageElement);
                });
            })
            .catch(error => {
                console.error("Erreur :", error);
            });
    }

    function updateUserList() {
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = `${user.nom}    ${user.prenom}`;

            userList.appendChild(li);
        });
    }

    function addMessage(content, isOwnMessage = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(isOwnMessage ? 'own-message' : 'other-message');
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.5s';
            messageDiv.style.opacity = '1';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    // Fonction qui actualise la page toutes les secondes
    function refreshPageContent() {
        fetchMessages();  // Rafraîchit les messages
        fetchUsers();     // Rafraîchit la liste des utilisateurs
    }

    // Actualisation automatique toutes les 1000 ms (1 seconde)
    setInterval(refreshPageContent, 1000);

    // Fonction pour envoyer un message
    async function sendMessage() {
        const message = messageInput.value.trim();

        if (message === '' || message.length < 2) {
            alert("Veuillez saisir un message d'au moins 2 caractères.");
            return;
        }

        sendButton.disabled = true;
        addMessage(message, true);
        messageInput.value = '';

        try {

            const userId = localStorage.getItem("userId"); // Récupérer l'ID stocké

            if (!userId) {
                alert("Utilisateur non connecté.");
                return;
            }

            const response = await fetch("http://192.168.65.113:20000/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contenu: message,
                    idutilisateur: userId
                })
            });

            if (response.ok) {
                fetchMessages();
            } else {
                alert("Erreur lors de l'envoi du message.");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        } finally {
            sendButton.disabled = false;
        }
    }

    async function addUser(username) {
        if (!users.includes(username)) {
            try {
                const response = await fetch("http://192.168.65.113:20000/api/addutilisateur", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username })
                });

                if (!response.ok) throw new Error("Erreur lors de l'ajout de l'utilisateur.");

                users.push(username);
                updateUserList();
                addMessage(`${username} a rejoint le chat.`, false);
            } catch (error) {
                console.error("Erreur lors de l'ajout de l'utilisateur :", error);
            }
        }
    }

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    fetchUsers();
    fetchMessages();


    creerBtn.addEventListener("click", async (event) => {
        event.preventDefault(); // Empêcher le rechargement de la page

        const nom = document.getElementById("nom").value.trim();
        const prenom = document.getElementById("prenom").value.trim();

        if (!nom || !prenom) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        try {
            const response = await fetch("http://192.168.65.113:20000/api/addutilisateur", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom, prenom })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); // Affiche un message de succès
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
        }
    });

    connexionBtn.addEventListener("click", async (event) => {
        event.preventDefault(); // Empêche le rechargement de la page

        const nomSaisi = document.getElementById("nom").value.trim();
        const prenomSaisi = document.getElementById("prenom").value.trim();

        if (!nomSaisi || !prenomSaisi) {
            alert("Veuillez saisir votre nom et prénom.");
            return;
        }

        try {
            const response = await fetch("http://192.168.65.113:20000/api/getutilisateur");
            const data = await response.json();

            if (response.ok) {
                console.log("Données reçues :", data); // Vérifie la structure des données

                // Trouver l'utilisateur correspondant
                const utilisateur = data.users.find(user =>
                    user.nom.toLowerCase() === nomSaisi.toLowerCase() &&
                    user.prenom.toLowerCase() === prenomSaisi.toLowerCase()
                );

                if (utilisateur) {
                    // Stocker l'ID de l'utilisateur connecté
                    localStorage.setItem("userId", utilisateur.idutilisateur);
                    alert(`Connexion réussie : Bienvenue ${utilisateur.nom} ${utilisateur.prenom} ${utilisateur.idutilisateur} !`);
                    console.log("Utilisateur connecté :", utilisateur);
                } else {
                    alert("Nom ou prénom incorrect.");
                }
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération:", error);
        }
    });
});

const button = document.getElementById('colorButton');

button.addEventListener('click', () => {
    // On génère une couleur aléatoire
    const randomColor = getRandomColor();
    document.body.style.backgroundColor = randomColor;
    
});

// Fonction pour générer une couleur aléatoire
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function toggleLED(state) {
    fetch("http://192.168.65.113:20000/api/led", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: state })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error("Erreur:", error));
}


document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("message-input");

    // Crée le bouton dynamiquement (si nécessaire)
    const button = document.createElement("button");
    button.textContent = "Led-Vert";
    document.body.appendChild(button);

    button.addEventListener("click", () => {
        container.textContent = "Bonjour, comment ça va ?";
    });
});




