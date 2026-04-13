(function () {
  "use strict";

  var optionCount = 0;

  function addOptionField() {
    optionCount += 1;

    var optionsContainer = document.getElementById("options");
    if (!optionsContainer) {
      return;
    }

    var input = document.createElement("input");
    input.type = "text";
    input.id = "opt" + optionCount;
    input.placeholder = "Option " + optionCount;

    optionsContainer.appendChild(input);
  }

  function createPoll() {
    var questionInput = document.getElementById("question");
    var question = questionInput ? questionInput.value.trim() : "";

    if (!question) {
      alert("Please enter a poll question.");
      return;
    }

    var options = [];

    for (var i = 1; i <= optionCount; i += 1) {
      var input = document.getElementById("opt" + i);
      var value = input ? input.value.trim() : "";

      if (value) {
        options.push({ id: options.length + 1, text: value, votes: 0 });
      }
    }

    if (options.length < 2) {
      alert("Please add at least two valid options.");
      return;
    }

    var polls = window.AppStorage.getJSON(window.AppStorage.keys.polls, []);
    polls.push({
      id: Date.now(),
      question: question,
      options: options
    });

    window.AppStorage.setJSON(window.AppStorage.keys.polls, polls);

    alert("Poll created successfully!");
    window.location.href = "home.html";
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.getAttribute("data-page") !== "admin") {
      return;
    }

    var addOptionBtn = document.getElementById("addOptionBtn");
    var createPollBtn = document.getElementById("createPollBtn");

    if (addOptionBtn) {
      addOptionBtn.addEventListener("click", addOptionField);
    }

    if (createPollBtn) {
      createPollBtn.addEventListener("click", createPoll);
    }

    addOptionField();
    addOptionField();
  });
})();
