document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('skillsRadar');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function getAccentColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? '#d4af37' : '#8c7355'; // Bitume Caviar Gold vs UMLA Brown
  }

  function getTextColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? '#f0f0f0' : '#121212';
  }

  let accentColor = getAccentColor();
  let textColor = getTextColor();

  const skillsData = {
    labels: ['JavaScript', 'PHP', 'C# / .NET', 'Python', 'TypeScript', 'SQL'],
    datasets: [{
      label: 'Niveau de maîtrise',
      data: [85, 80, 75, 70, 75, 80],
      backgroundColor: accentColor + '33', // Transparence à 20%
      borderColor: accentColor,
      borderWidth: 2,
      pointBackgroundColor: accentColor,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: accentColor,
      pointRadius: 5
    }]
  };

  const chartConfig = {
    type: 'radar',
    data: skillsData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          angleLines: { color: 'rgba(150, 150, 150, 0.2)' },
          grid: { color: 'rgba(150, 150, 150, 0.2)' },
          pointLabels: {
            color: textColor,
            font: { size: 13, weight: 'bold' }
          },
          ticks: {
            display: false,
            max: 100,
            min: 0,
            stepSize: 20
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Maîtrise : ${context.raw}%`
          }
        }
      },
      onClick: (e, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const techName = skillsData.labels[index];
          // Redirection vers la page projets avec le filtre actif
          window.location.href = `projets.html?tech=${encodeURIComponent(techName)}`;
        }
      }
    }
  };

  let radarChart = new Chart(ctx, chartConfig);

  // Mettre à jour les couleurs du graphique lors du changement de thème
  window.addEventListener('themeChanged', (e) => {
    const newAccent = e.detail === 'dark' ? '#d4af37' : '#8c7355';
    const newText = e.detail === 'dark' ? '#f0f0f0' : '#121212';

    radarChart.data.datasets[0].backgroundColor = newAccent + '33';
    radarChart.data.datasets[0].borderColor = newAccent;
    radarChart.data.datasets[0].pointBackgroundColor = newAccent;
    radarChart.options.scales.r.pointLabels.color = newText;
    radarChart.update();
  });
});