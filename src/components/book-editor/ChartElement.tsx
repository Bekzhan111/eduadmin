import React, { useState, useEffect, useRef } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  ArcElement, 
  RadialLinearScale, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  ChartOptions
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash } from 'lucide-react';
import { CanvasElement } from './types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

type ChartElementProps = {
  element: CanvasElement;
  isEditing: boolean;
  onUpdate: (updates: Partial<CanvasElement>) => void;
};

type ChartDataType = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
};

type ChartOptionsType = {
  title?: string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'right' | 'bottom' | 'left';
  xAxisTitle?: string;
  yAxisTitle?: string;
  stacked?: boolean;
  beginAtZero?: boolean;
  aspectRatio?: number;
};

export function ChartElement({ element, isEditing, onUpdate }: ChartElementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const initializedRef = useRef(false);
  
  // Отладочная информация
  console.log('ChartElement rendered with props:', { 
    elementType: element.type, 
    chartType: element.properties.chartType,
    hasChartData: !!element.properties.chartData,
    hasChartOptions: !!element.properties.chartOptions,
    elementProperties: element.properties
  });
  
  // Инициализируем данные по умолчанию, если они отсутствуют
  const defaultChartData: ChartDataType = {
    labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
    datasets: [
      {
        label: 'Данные 1',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const defaultChartOptions: ChartOptionsType = {
    title: 'Диаграмма',
    showLegend: true,
    legendPosition: 'top',
    xAxisTitle: 'X',
    yAxisTitle: 'Y',
    stacked: false,
    beginAtZero: true,
    aspectRatio: 2,
  };
  
  // Используем данные из свойств элемента или данные по умолчанию
  const [chartData, setChartData] = useState<ChartDataType>(
    element.properties.chartData || defaultChartData
  );
  
  const [chartOptions, setChartOptions] = useState<ChartOptionsType>(
    element.properties.chartOptions || defaultChartOptions
  );

  // Инициализируем свойства диаграммы при монтировании компонента
  useEffect(() => {
    // Проверяем, есть ли необходимые свойства, и если нет, инициализируем их
    // Используем ref для предотвращения повторных инициализаций
    if (!initializedRef.current && 
        (!element.properties.chartData || 
         !element.properties.chartOptions || 
         !element.properties.chartType)) {
      
      console.log('Initializing chart properties with defaults');
      
      // Определяем тип диаграммы, если он не указан
      const chartType = element.properties.chartType || 'bar';
      
      // Обновляем свойства элемента
      onUpdate({
        properties: {
          ...element.properties,
          chartType: chartType,
          chartData: defaultChartData,
          chartOptions: defaultChartOptions,
        },
      });
      
      // Также обновляем локальное состояние
      setChartData(defaultChartData);
      setChartOptions(defaultChartOptions);
      
      // Помечаем, что инициализация выполнена
      initializedRef.current = true;
    }
  }, [element.id, element.properties, onUpdate, defaultChartData, defaultChartOptions]);

  // Update parent element when chart data or options change only when explicitly triggered
  // Не используем useEffect для автоматического обновления, чтобы избежать циклических обновлений
  const updateParentElement = () => {
    onUpdate({
      properties: {
        ...element.properties,
        chartData,
        chartOptions,
      },
    });
  };

  // Handle double-click to edit
  const handleDoubleClick = () => {
    setIsDialogOpen(true);
  };

  // Apply changes from dialog
  const handleApplyChanges = () => {
    // Обновляем родительский элемент только при явном применении изменений
    onUpdate({
      properties: {
        ...element.properties,
        chartData,
        chartOptions,
      },
    });
    setIsDialogOpen(false);
  };

  // Add new dataset
  const addDataset = () => {
    // Generate a random color
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    const backgroundColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
    const borderColor = `rgba(${r}, ${g}, ${b}, 1)`;

    const newDataset = {
      label: `Данные ${chartData.datasets.length + 1}`,
      data: chartData.labels.map(() => Math.floor(Math.random() * 20)),
      backgroundColor,
      borderColor,
      borderWidth: 1,
    };

    setChartData({
      ...chartData,
      datasets: [...chartData.datasets, newDataset],
    });
  };

  // Remove dataset
  const removeDataset = (index: number) => {
    const newDatasets = [...chartData.datasets];
    newDatasets.splice(index, 1);
    setChartData({
      ...chartData,
      datasets: newDatasets,
    });
  };

  // Update dataset label
  const updateDatasetLabel = (index: number, label: string) => {
    const newDatasets = [...chartData.datasets];
    newDatasets[index] = {
      ...newDatasets[index],
      label,
    };
    setChartData({
      ...chartData,
      datasets: newDatasets,
    });
  };

  // Update dataset data
  const updateDatasetData = (datasetIndex: number, dataString: string) => {
    try {
      // Parse comma-separated values
      const newData = dataString.split(',').map(val => parseFloat(val.trim()));
      
      const newDatasets = [...chartData.datasets];
      newDatasets[datasetIndex] = {
        ...newDatasets[datasetIndex],
        data: newData,
      };
      
      setChartData({
        ...chartData,
        datasets: newDatasets,
      });
    } catch (error) {
      console.error('Error parsing data:', error);
    }
  };

  // Update labels
  const updateLabels = (labelsString: string) => {
    const newLabels = labelsString.split(',').map(label => label.trim());
    setChartData({
      ...chartData,
      labels: newLabels,
    });
    
    // Adjust dataset lengths if needed
    const newDatasets = chartData.datasets.map(dataset => {
      const currentData = [...dataset.data];
      const newData = [...currentData];
      
      // Add or remove data points to match new labels length
      while (newData.length < newLabels.length) {
        newData.push(0);
      }
      while (newData.length > newLabels.length) {
        newData.pop();
      }
      
      return {
        ...dataset,
        data: newData,
      };
    });
    
    setChartData({
      labels: newLabels,
      datasets: newDatasets,
    });
  };

  // Render chart based on type
  const renderChart = () => {
    // Проверяем, что chartType существует, иначе используем 'bar' по умолчанию
    const chartType = element.properties.chartType || 'bar';
    console.log('Rendering chart of type:', chartType);
    
    // Проверяем наличие данных для диаграммы
    if (!chartData || !chartData.labels || !chartData.datasets || chartData.datasets.length === 0) {
      console.error('Missing chart data');
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
          Загрузка данных диаграммы...
        </div>
      );
    }
    
    // Use proper type casting for the options
    const legendPosition = chartOptions.legendPosition || 'top';
    
    const options: any = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: !!chartOptions.title,
          text: chartOptions.title || '',
        },
        legend: {
          display: chartOptions.showLegend,
          position: legendPosition,
        },
      },
      scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
        x: {
          title: {
            display: !!chartOptions.xAxisTitle,
            text: chartOptions.xAxisTitle || '',
          },
          stacked: chartOptions.stacked,
        },
        y: {
          title: {
            display: !!chartOptions.yAxisTitle,
            text: chartOptions.yAxisTitle || '',
          },
          stacked: chartOptions.stacked,
          beginAtZero: chartOptions.beginAtZero,
        },
      } : undefined,
    };

    try {
      switch (chartType) {
        case 'bar':
          return <Bar data={chartData} options={options} />;
        case 'line':
          return <Line data={chartData} options={options} />;
        case 'pie':
          return <Pie data={chartData} options={options} />;
        case 'doughnut':
          return <Doughnut data={chartData} options={options} />;
        case 'radar':
          return <Radar data={chartData} options={options} />;
        default:
          console.log('Using default chart type (bar)');
          return <Bar data={chartData} options={options} />;
      }
    } catch (error) {
      console.error('Error rendering chart:', error);
      return <div className="w-full h-full flex items-center justify-center">Ошибка отображения диаграммы</div>;
    }
  };

  return (
    <>
      <div 
        className="w-full h-full cursor-pointer" 
        onDoubleClick={handleDoubleClick}
      >
        {/* Проверка наличия данных для диаграммы и отображение соответствующего контента */}
        {element.properties.chartData && element.properties.chartOptions ? (
          renderChart()
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
            Двойной клик для настройки диаграммы
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-2 mb-2 border-b pr-8">
            <DialogTitle>Редактировать диаграмму</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="data">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="data">Данные</TabsTrigger>
              <TabsTrigger value="appearance">Внешний вид</TabsTrigger>
              <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
            </TabsList>
            
            <TabsContent value="data" className="space-y-4">
              <div className="space-y-2">
                <Label>Метки (через запятую)</Label>
                <Textarea 
                  value={chartData.labels.join(', ')}
                  onChange={(e) => updateLabels(e.target.value)}
                  placeholder="Янв, Фев, Мар, Апр, Май, Июн"
                  className="min-h-[60px]"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Наборы данных</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={addDataset}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Добавить
                  </Button>
                </div>
                
                {chartData.datasets.map((dataset, index) => (
                  <div key={index} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: Array.isArray(dataset.backgroundColor) 
                            ? dataset.backgroundColor[0] 
                            : dataset.backgroundColor 
                          }}
                        />
                        <Input 
                          value={dataset.label}
                          onChange={(e) => updateDatasetLabel(index, e.target.value)}
                          className="max-w-[200px]"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeDataset(index)}
                        disabled={chartData.datasets.length <= 1}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Значения (через запятую)</Label>
                      <Textarea 
                        value={dataset.data.join(', ')}
                        onChange={(e) => updateDatasetData(index, e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Тип диаграммы</Label>
                  <Select 
                    value={element.properties.chartType || 'bar'} 
                    onValueChange={(value) => {
                      // Получаем тип диаграммы
                      const chartType = value as 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
                      
                      // Обновляем заголовок в зависимости от типа диаграммы
                      let newTitle = chartOptions.title;
                      if (!chartOptions.title || chartOptions.title === 'Столбчатая диаграмма' || 
                          chartOptions.title === 'Линейная диаграмма' || chartOptions.title === 'Круговая диаграмма' || 
                          chartOptions.title === 'Кольцевая диаграмма' || chartOptions.title === 'Радарная диаграмма') {
                        switch (chartType) {
                          case 'bar':
                            newTitle = 'Столбчатая диаграмма';
                            break;
                          case 'line':
                            newTitle = 'Линейная диаграмма';
                            break;
                          case 'pie':
                            newTitle = 'Круговая диаграмма';
                            break;
                          case 'doughnut':
                            newTitle = 'Кольцевая диаграмма';
                            break;
                          case 'radar':
                            newTitle = 'Радарная диаграмма';
                            break;
                          default:
                            newTitle = 'Диаграмма';
                        }
                      }
                      
                      // Обновляем свойства элемента
                      onUpdate({
                        properties: {
                          ...element.properties,
                          chartType,
                          chartOptions: {
                            ...element.properties.chartOptions,
                            title: newTitle
                          }
                        },
                      });
                      
                      // Обновляем локальное состояние
                      setChartOptions({
                        ...chartOptions,
                        title: newTitle
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Столбчатая</SelectItem>
                      <SelectItem value="line">Линейная</SelectItem>
                      <SelectItem value="pie">Круговая</SelectItem>
                      <SelectItem value="doughnut">Кольцевая</SelectItem>
                      <SelectItem value="radar">Радарная</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Заголовок диаграммы</Label>
                  <Input 
                    value={chartOptions.title || ''} 
                    onChange={(e) => setChartOptions({
                      ...chartOptions,
                      title: e.target.value,
                    })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showLegend" 
                  checked={chartOptions.showLegend} 
                  onCheckedChange={(checked) => setChartOptions({
                    ...chartOptions,
                    showLegend: !!checked,
                  })}
                />
                <Label htmlFor="showLegend">Показать легенду</Label>
              </div>
              
              {chartOptions.showLegend && (
                <div>
                  <Label>Позиция легенды</Label>
                  <Select 
                    value={chartOptions.legendPosition || 'top'} 
                    onValueChange={(value) => setChartOptions({
                      ...chartOptions,
                      legendPosition: value as 'top' | 'right' | 'bottom' | 'left',
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите позицию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Сверху</SelectItem>
                      <SelectItem value="right">Справа</SelectItem>
                      <SelectItem value="bottom">Снизу</SelectItem>
                      <SelectItem value="left">Слева</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {(element.properties.chartType === 'bar' || element.properties.chartType === 'line') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Название оси X</Label>
                      <Input 
                        value={chartOptions.xAxisTitle || ''} 
                        onChange={(e) => setChartOptions({
                          ...chartOptions,
                          xAxisTitle: e.target.value,
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Название оси Y</Label>
                      <Input 
                        value={chartOptions.yAxisTitle || ''} 
                        onChange={(e) => setChartOptions({
                          ...chartOptions,
                          yAxisTitle: e.target.value,
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="stacked" 
                      checked={chartOptions.stacked} 
                      onCheckedChange={(checked) => setChartOptions({
                        ...chartOptions,
                        stacked: !!checked,
                      })}
                    />
                    <Label htmlFor="stacked">Стековая диаграмма</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="beginAtZero" 
                      checked={chartOptions.beginAtZero} 
                      onCheckedChange={(checked) => setChartOptions({
                        ...chartOptions,
                        beginAtZero: !!checked,
                      })}
                    />
                    <Label htmlFor="beginAtZero">Начинать с нуля</Label>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="preview" className="min-h-[300px] max-h-[400px] overflow-auto">
              <div className="border rounded-md p-4 h-full">
                {renderChart()}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="sticky bottom-0 bg-background z-10 pt-2 mt-2 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleApplyChanges}>Применить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
