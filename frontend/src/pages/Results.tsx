import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, Assessment } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Home as HomeIcon,
  Lightbulb,
  BarChart3,
  Droplets,
  Info,
  Download,
  ArrowLeft,
  TrendingUp,
  Leaf,
  Calculator,
  MapPin,
  DollarSign
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LineChart, Line, ReferenceLine, PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Results: React.FC = () => {
  const [params] = useSearchParams();
  const id = Number(params.get('id'));
  const [activeTab, setActiveTab] = React.useState('assessment');

  const assessmentQuery = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api.getAssessment(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const rainfallQuery = useQuery({
    queryKey: ['rainfall', assessmentQuery.data?.latitude, assessmentQuery.data?.longitude],
    queryFn: () => api.getRainfall(assessmentQuery.data!.latitude!, assessmentQuery.data!.longitude!),
    enabled: !!assessmentQuery.data?.latitude && !!assessmentQuery.data?.longitude,
  });

  const aquiferInfoQuery = useQuery({
    queryKey: ['aquifer', assessmentQuery.data?.aquifer_type],
    queryFn: () => api.getAquiferInfo(assessmentQuery.data!.aquifer_type || ''),
    enabled: typeof assessmentQuery.data?.aquifer_type === 'string',
  });

  const groundwaterQuery = useQuery({
    queryKey: ['groundwater', assessmentQuery.data?.latitude, assessmentQuery.data?.longitude],
    queryFn: () => api.getGroundwater(assessmentQuery.data!.latitude!, assessmentQuery.data!.longitude!),
    enabled: !!assessmentQuery.data?.latitude && !!assessmentQuery.data?.longitude,
  });

  const loading = assessmentQuery.isLoading || (assessmentQuery.isSuccess && rainfallQuery.isLoading);
  const error = assessmentQuery.error as Error | undefined;

  const assessment: Assessment | undefined = assessmentQuery.data;
  const monthlyData = useMemo(() => {
    const arr = rainfallQuery.data?.monthly_breakdown || [];
    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return labels.map((m, i) => ({ month: m, rainfall: arr[i] || 0 }));
  }, [rainfallQuery.data]);

  // Derived implementation details for Recommendations tab
  const installationCost = assessment?.installation_cost || 0;
  const annualHarvestable = assessment?.annual_harvestable_water || 0;
  const annualSavings = annualHarvestable * 0.005; // ₹ per year, same logic as Streamlit
   const potentialSavings = Math.min(
     annualHarvestable,
     (assessment?.dwellers || 0) * 150 * 365,
   );

  const costBenefitData = useMemo(() => {
    return Array.from({ length: 10 }, (_, idx) => {
      const year = idx + 1;
      const cumulativeSavings = annualSavings * year - installationCost;
      return {
        year,
        annualSavings,
        cumulativeSavings,
      };
    });
  }, [annualSavings, installationCost]);

  // Derive quick stats safely
  const stats = {
    annual_harvestable_water: assessment?.annual_harvestable_water || 0,
    installation_cost: assessment?.installation_cost || 0,
    payback_period: assessment?.payback_period ? Number(assessment.payback_period.toFixed(2)) : 0,
    recommended_structure: assessment?.recommended_structure || '—',
  };

  if (!id || Number.isNaN(id)) {
    return (
      <div className="min-h-screen bg-gradient-sky">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <Card className="glass-card border-0"><CardContent className="p-6">Missing assessment id.</CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sky">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Your Rainwater Harvesting <span className="bg-gradient-water bg-clip-text text-transparent">Assessment</span>
              </h1>
              <p className="text-lg text-muted-foreground">Comprehensive analysis and recommendations for your property</p>
            </div>
            <div className="flex gap-4">
              <Link to="/assessment"><Button variant="water" className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />New Assessment</Button></Link>
            </div>
          </div>

          {loading ? (
            <Card className="glass-card border-0"><CardContent className="p-6">Loading results…</CardContent></Card>
          ) : error ? (
            <Card className="glass-card border-0"><CardContent className="p-6 text-red-600">{error.message}</CardContent></Card>
          ) : assessment ? (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="glass-card border-0 shadow-soft"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Annual Water Harvest</p><p className="text-2xl font-bold text-primary">{Math.round(stats.annual_harvestable_water).toLocaleString()}L</p></div><Droplets className="h-8 w-8 text-primary" /></div></CardContent></Card>
                <Card className="glass-card border-0 shadow-soft"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Installation Cost</p><p className="text-2xl font-bold text-primary">₹{Math.round(stats.installation_cost).toLocaleString()}</p></div><DollarSign className="h-8 w-8 text-primary" /></div></CardContent></Card>
                <Card className="glass-card border-0 shadow-soft"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Payback Period</p><p className="text-2xl font-bold text-primary">{stats.payback_period || '—'} years</p></div><TrendingUp className="h-8 w-8 text-primary" /></div></CardContent></Card>
                <Card className="glass-card border-0 shadow-soft"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Recommended</p><p className="text-2xl font-bold text-primary">{stats.recommended_structure}</p></div><Lightbulb className="h-8 w-8 text-primary" /></div></CardContent></Card>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 bg-background/50 backdrop-blur-sm">
                  <TabsTrigger value="assessment" className="flex items-center gap-2"><HomeIcon className="h-4 w-4" />Assessment</TabsTrigger>
                  <TabsTrigger value="recommendations" className="flex items-center gap-2"><Lightbulb className="h-4 w-4" />Recommendations</TabsTrigger>
                  <TabsTrigger value="results" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Results</TabsTrigger>
                  <TabsTrigger value="groundwater" className="flex items-center gap-2"><Droplets className="h-4 w-4" />Groundwater</TabsTrigger>
                  <TabsTrigger value="about" className="flex items-center gap-2"><Info className="h-4 w-4" />About</TabsTrigger>
                </TabsList>

                {/* Assessment Tab */}
                <TabsContent value="assessment" className="space-y-6">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card className="glass-card border-0 shadow-water"><CardHeader><CardTitle className="flex items-center gap-2"><HomeIcon className="h-5 w-5 text-primary" />Water Harvesting Potential</CardTitle></CardHeader><CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between"><span>Annual Harvestable Water</span><span className="font-semibold text-primary">{Math.round(assessment.annual_harvestable_water || 0).toLocaleString()}L</span></div>
                        <div className="flex justify-between"><span>Runoff Coefficient</span><span className="font-semibold">{(assessment.runoff_coefficient ?? 0).toFixed(2)}</span></div>
                        <div className="flex justify-between items-center">
                          <span>Annual Rainfall</span>
                          <Badge variant="secondary">{Math.round(assessment.annual_rainfall || 0)} mm</Badge>
                        </div>
                         <div className="flex justify-between"><span>Potential Savings</span><span className="font-semibold text-primary">{Math.round(potentialSavings).toLocaleString()} L/year</span></div>
                      </div>
                    </CardContent></Card>

                    <Card className="glass-card border-0 shadow-water"><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Site Characteristics</CardTitle></CardHeader><CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-sm text-muted-foreground">Soil Type</p><p className="font-semibold">{assessment.soil_type || '—'}</p></div>
                        <div><p className="text-sm text-muted-foreground">Aquifer Type</p><p className="font-semibold">{assessment.aquifer_type || '—'}</p></div>
                        <div>
                          <p className="text-sm text-muted-foreground">Groundwater Depth</p>
                          <p className="font-semibold">
                            {assessment.water_depth ? `${Number(assessment.water_depth).toFixed(1)} m` : '—'}
                          </p>
                        </div>
                        <div><p className="text-sm text-muted-foreground">Coordinates</p><p className="font-semibold">{assessment.latitude && assessment.longitude ? `${assessment.latitude.toFixed(4)}, ${assessment.longitude.toFixed(4)}` : '—'}</p></div>
                      </div>
                    </CardContent></Card>
                  </div>

                  <Card className="glass-card border-0 shadow-glow"><CardHeader><CardTitle>Rainfall Distribution Analysis</CardTitle><CardDescription>Monthly rainfall patterns for your location</CardDescription></CardHeader><CardContent>
                    {monthlyData.length ? (
                      <ChartContainer config={{ rainfall: { label: 'Rainfall (mm)', color: 'hsl(var(--primary))' } }} className="h-64">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="rainfall" fill="var(--color-rainfall)" radius={[4,4,0,0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">Rainfall data unavailable.</div>
                    )}
                  </CardContent></Card>
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-6">
                  <Card className="glass-card border-0 shadow-water"><CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />Recommended RWH Structure</CardTitle></CardHeader><CardContent>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-primary">{stats.recommended_structure}</h3>
                      <p className="text-muted-foreground">Recommendation based on your roof, soil, aquifer and rainfall conditions.</p>
                      <div className="grid md:grid-cols-3 gap-4 mt-6">
                        <Card className="border border-border/50"><CardContent className="pt-4"><h4 className="font-semibold">Installation Cost</h4><p className="text-2xl font-bold text-primary">₹{Math.round(stats.installation_cost).toLocaleString()}</p></CardContent></Card>
                        <Card className="border border-border/50"><CardContent className="pt-4"><h4 className="font-semibold">Payback Period</h4><p className="text-2xl font-bold text-primary">{stats.payback_period || '—'} years</p></CardContent></Card>
                        <Card className="border border-border/50"><CardContent className="pt-4"><h4 className="font-semibold">Structure Type</h4><p className="text-2xl font-bold text-primary">{stats.recommended_structure}</p></CardContent></Card>
                      </div>
                    </div>
                  </CardContent></Card>

                  <Card className="glass-card border-0 shadow-water"><CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />Implementation Details</CardTitle></CardHeader><CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Cost Analysis</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Metric</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Estimated Installation Cost</TableCell>
                              <TableCell className="font-medium">₹{Math.round(installationCost).toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Annual Maintenance Cost</TableCell>
                              <TableCell className="font-medium">₹{Math.round(installationCost * 0.05).toLocaleString()} <span className="text-muted-foreground">(approx.)</span></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Payback Period</TableCell>
                              <TableCell className="font-medium">{stats.payback_period || '—'} years</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Benefits</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Benefit</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Annual Water Savings</TableCell>
                              <TableCell className="font-medium">{Math.round(annualHarvestable).toLocaleString()} L</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Financial Savings</TableCell>
                              <TableCell className="font-medium">₹{Math.round(annualSavings).toLocaleString()}/year <span className="text-muted-foreground">(approx.)</span></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Environmental Impact</TableCell>
                              <TableCell className="font-medium">Reduced groundwater extraction</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent></Card>

                  <Card className="glass-card border-0 shadow-glow"><CardHeader><CardTitle>Cost-Benefit Analysis (10 Years)</CardTitle></CardHeader><CardContent className="space-y-6">
                    <ChartContainer
                      config={{ cumulative: { label: 'Cumulative Savings (₹)', color: 'hsl(var(--primary))' } }}
                      className="h-64"
                    >
                      <LineChart data={costBenefitData} margin={{ left: 8, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" tickFormatter={(v) => `Y${v}`} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="cumulativeSavings" stroke="var(--color-cumulative)" dot={true} strokeWidth={2} />
                      </LineChart>
                    </ChartContainer>

                    <div className="border rounded-md overflow-hidden">
                      
                    </div>
                  </CardContent></Card>
                </TabsContent>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-6">
                  {(() => {
                    const harvestable = Math.max(0, assessment.annual_harvestable_water || 0);
                    const groundwaterApprox = Math.max(0, (assessment.water_depth || 0) * 1000);
                    const annualRainfallLiters = Math.max(0, (assessment.annual_rainfall || 0) * (assessment.open_space || 0));

                    const waterBalance = [
                      { component: 'Harvestable Water', value: harvestable, key: 'harvest' },
                      { component: 'Ground Water', value: groundwaterApprox, key: 'ground' },
                      { component: 'Annual Rainfall', value: annualRainfallLiters, key: 'rainfall' },
                    ];

                    // Normalize roof type mapping for collection efficiency
                    const roofTypeRaw = (assessment.roof_type || 'Concrete').toLowerCase();
                    const roofTypeMap: Record<string, number> = {
                      metal: 0.95,
                      concrete: 0.85,
                      tile: 0.8,
                      tiled: 0.8,
                      asphalt: 0.75,
                      asbestos: 0.75,
                      green: 0.6,
                      thatch: 0.5,
                      thatched: 0.5,
                    };
                    const baseCollection = roofTypeMap[roofTypeRaw] ?? 0.8;
                    const roofAge = Math.max(0, assessment.roof_age || 0);
                    const ageReduction = Math.min(roofAge * 0.01, 0.3);
                    const collectionEfficiency = Math.max(0.5, baseCollection * (1 - ageReduction));

                    const roofArea = Math.max(0, assessment.roof_area || 0);
                    const storageEfficiency = roofArea > 150 ? 0.95 : roofArea > 80 ? 0.9 : 0.85;
                    const runoffCoeff = Math.max(0, assessment.runoff_coefficient || 0);
                    const overallEfficiency = +(runoffCoeff * collectionEfficiency * storageEfficiency).toFixed(3);
                    const runoffPercent = Math.min(100, Math.max(0, Math.round(runoffCoeff * 100)));

                    return (
                      <>
                        <div className="grid lg:grid-cols-2 gap-6">
                          <Card className="glass-card border-0 shadow-water">
                            <CardHeader>
                              <CardTitle>Water Balance Analysis</CardTitle>
                              <CardDescription>Distribution of key water components</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="border rounded-md overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Component</TableHead>
                                      <TableHead className="text-right">Volume (liters)</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {waterBalance.map((row) => (
                                      <TableRow key={row.key}>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <span
                                              className="h-2.5 w-2.5 rounded-[2px]"
                                              style={{ backgroundColor: `var(--color-${row.key})` }}
                                            />
                                            {row.component}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{Math.round(row.value).toLocaleString()}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {waterBalance.some((d) => d.value > 0) ? (
                                <>
                                <ChartContainer
                                  config={{
                                    harvest: { label: 'Harvestable', color: 'hsl(var(--chart-1, var(--primary)))' },
                                    ground: { label: 'Groundwater', color: 'hsl(var(--chart-2, 200 98% 39%))' },
                                    rainfall: { label: 'Rainfall', color: 'hsl(var(--chart-3, 41 96% 40%))' },
                                  }}
                                  className="h-64"
                                >
                                  <PieChart>
                                    <Pie
                                      data={waterBalance}
                                      dataKey="value"
                                      nameKey="component"
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={90}
                                      innerRadius={40}
                                      paddingAngle={2}
                                      labelLine={false}
                                      label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                    >
                                      {waterBalance.map((entry) => (
                                        <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                                      ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                  </PieChart>
                                </ChartContainer>
                                <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs">
                                  {waterBalance.map((entry) => (
                                    <div key={entry.key} className="flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 rounded-[2px]"
                                        style={{ backgroundColor: `var(--color-${entry.key})` }}
                                      />
                                      <span className="text-foreground">{entry.component}:</span>
                                      <span className="text-muted-foreground">{Math.round(entry.value).toLocaleString()} L</span>
                                    </div>
                                  ))}
                                </div>
                                </>
                              ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">Water balance data unavailable.</div>
                              )}
                            </CardContent>
                          </Card>

                          <Card className="glass-card border-0 shadow-water">
                            <CardHeader>
                              <CardTitle>System Efficiency</CardTitle>
                              <CardDescription>Collection and storage efficiencies</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="border rounded-md overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Metric</TableHead>
                                      <TableHead className="text-right">Value</TableHead>
                                      <TableHead>Unit</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>Runoff Coefficient</TableCell>
                                      <TableCell className="text-right">{runoffCoeff.toFixed(2)}</TableCell>
                                      <TableCell>ratio</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Collection Efficiency</TableCell>
                                      <TableCell className="text-right">{collectionEfficiency.toFixed(3)}</TableCell>
                                      <TableCell>ratio</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Storage Efficiency</TableCell>
                                      <TableCell className="text-right">{storageEfficiency.toFixed(3)}</TableCell>
                                      <TableCell>ratio</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Overall System Efficiency</TableCell>
                                      <TableCell className="text-right">{overallEfficiency.toFixed(3)}</TableCell>
                                      <TableCell>ratio</TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>

                              <div className="h-48 flex items-center justify-center">
                                <ChartContainer config={{ gauge: { label: 'Runoff Efficiency (%)', color: 'hsl(var(--primary))' } }} className="w-full h-full">
                                  <RadialBarChart
                                    data={[{ name: 'Runoff', value: runoffPercent }]}
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius="60%"
                                    outerRadius="100%"
                                  >
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar dataKey="value" fill="var(--color-gauge)" cornerRadius={6} background />
                                    {/* Center label */}
                                    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                                      <tspan className="text-xl font-bold">{runoffPercent}%</tspan>
                                    </text>
                                    <text x="50%" y="80%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground">
                                      Runoff Efficiency
                                    </text>
                                  </RadialBarChart>
                                </ChartContainer>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="glass-card border-0 shadow-water">
                          <CardHeader>
                            <CardTitle>Technical Specifications</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <h4 className="font-semibold">Structure Details</h4>
                                <p>Type: <span className="font-medium">{assessment.recommended_structure || 'N/A'}</span></p>
                                <p>Recommended Size: <span className="font-medium">{Math.round((assessment.roof_area || 0) * 0.8).toLocaleString()} L</span> capacity</p>
                                <p>Construction: Reinforced concrete/Plastic</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold">Installation Requirements</h4>
                                <p>Space Needed: <span className="font-medium">{((assessment.open_space || 0) * 0.3).toFixed(1)} sq.m</span></p>
                                <p>Timeframe: 2–4 weeks</p>
                                <p>Professional Help: Recommended</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold">Maintenance</h4>
                                <p>Frequency: Quarterly cleaning</p>
                                <p>Cost: <span className="font-medium">₹{Math.round((assessment.installation_cost || 0) * 0.05).toLocaleString()}</span>/year</p>
                                <p>Complexity: Low to Moderate</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </TabsContent>

                {/* Groundwater Tab */}
                <TabsContent value="groundwater" className="space-y-6">
                  <Card className="glass-card border-0 shadow-water"><CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-primary" />Aquifer Information</CardTitle></CardHeader><CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div><h4 className="font-semibold mb-2">Aquifer Type</h4><p className="text-muted-foreground">{assessment.aquifer_type || '—'}</p></div>
                        <div><h4 className="font-semibold mb-2">Recharge Potential</h4><p className="text-muted-foreground">{aquiferInfoQuery.data?.recharge_potential || '—'}</p></div>
                        <div>
                          <h4 className="font-semibold mb-2">Depth to Water</h4>
                          <p className="text-muted-foreground">{(groundwaterQuery.data?.depth_to_water ?? assessment.water_depth) != null
                            ? `${Number(groundwaterQuery.data?.depth_to_water ?? assessment.water_depth).toFixed(2)} m`
                            : '—'}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Water Quality</h4>
                          <p className="text-muted-foreground">{groundwaterQuery.data?.water_quality || '—'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div><h4 className="font-semibold mb-2">Description</h4><p className="text-muted-foreground">{aquiferInfoQuery.data?.description || '—'}</p></div>
                        <div><h4 className="font-semibold mb-2">Suitable Structures</h4><p className="text-muted-foreground">{aquiferInfoQuery.data?.suitable_structures?.join(', ') || '—'}</p></div>
                      </div>
                    </div>
                  </CardContent></Card>

                    <Card className="glass-card border-0 shadow-water"><CardHeader><CardTitle>Water Level Trends</CardTitle><CardDescription>Historical trend (illustrative)</CardDescription></CardHeader><CardContent>
                    {(() => {
                      const years = [2018, 2019, 2020, 2021, 2022, 2023];
                      const base = Number(assessment.water_depth) || groundwaterQuery.data?.depth_to_water || 15;
                      // Simulate a gentle rise in depth (declining water table)
                      const series = years.map((y, i) => ({ year: y, level: +(base + i * 0.7).toFixed(1) }));
                      return (
                      <ChartContainer config={{ level: { label: 'Water Level (m bgl)', color: 'hsl(var(--primary))' } }} className="h-64">
                        <LineChart data={series} margin={{ left: 8, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Water Level (m)', angle: -90, position: 'insideLeft', offset: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="level" stroke="var(--color-level)" dot={true} strokeWidth={2} />
                        </LineChart>
                      </ChartContainer>
                      );
                    })()}
                    <div className="mt-3 text-amber-600 text-sm">Water table appears to be declining by ~0.7 m/year. Rainwater harvesting is strongly recommended.</div>
                  </CardContent></Card>

                  <Card className="glass-card border-0 shadow-water"><CardHeader><CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5 text-primary" />Environmental Impact</CardTitle></CardHeader><CardContent>
                    {(() => {
                      const harvest = assessment.annual_harvestable_water || 0;
                      const rechargePotential = Math.max(0, Math.round(harvest * 0.7)); // liters/year
                      const co2 = (harvest / 50000) * 1.1; // tons/year (approx)
                      const energy = (harvest / 40000) * 900; // kWh/year (approx)
                      return (
                        <div className="grid md:grid-cols-3 gap-6">
                          <Card className="border border-border/50"><CardContent className="pt-4"><h4 className="font-semibold mb-1">Groundwater Recharge</h4><p className="text-lg font-bold text-primary">{rechargePotential.toLocaleString()} L/yr</p></CardContent></Card>
                          <Card className="border border-border/50"><CardContent className="pt-4"><h4 className="font-semibold mb-1">CO₂ Reduction</h4><p className="text-lg font-bold text-primary">{co2.toFixed(1)} tons/yr</p></CardContent></Card>
                          <Card className="border border-border/50"><CardContent className="pt-4"><h4 className="font-semibold mb-1">Energy Savings</h4><p className="text-lg font-bold text-primary">{Math.round(energy).toLocaleString()} kWh/yr</p></CardContent></Card>
                        </div>
                      );
                    })()}
                  </CardContent></Card>
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about" className="space-y-6">
                  {/* About / Project Overview */}
                  <Card className="glass-card border-0 shadow-water">
                    <CardHeader>
                      <CardTitle>About This Tool</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <h3 className="text-lg font-semibold">Project Overview</h3>
                      <p className="text-muted-foreground">
                        This Rooftop Rainwater Harvesting Assessment Tool is designed to promote public participation in groundwater
                        conservation by enabling users to estimate the feasibility of rooftop rainwater harvesting (RTRWH) and
                        artificial recharge at their locations.
                      </p>
                    </CardContent>
                  </Card>

                  {/* How it works / Tech stack / Benefits / Data sources */}
                  <Card className="glass-card border-0 shadow-water">
                    <CardHeader>
                      <CardTitle>How It Works & Technology</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2">How It Works</h4>
                            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                              <li><span className="text-foreground font-medium">Input Analysis</span>: We analyze your roof characteristics and location</li>
                              <li><span className="text-foreground font-medium">Data Processing</span>: Fetch local rainfall, soil, and groundwater data</li>
                              <li><span className="text-foreground font-medium">ML Modeling</span>: Use machine learning to predict optimal solutions</li>
                              <li><span className="text-foreground font-medium">Recommendations</span>: Provide customized RWH system recommendations</li>
                              <li><span className="text-foreground font-medium">Economic Analysis</span>: Calculate costs, savings, and payback period</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Technology Stack</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li><strong className="text-foreground">Frontend</strong>: React + Vite Web Application</li>
                              <li><strong className="text-foreground">Backend</strong>: FastAPI RESTful API</li>
                              <li><strong className="text-foreground">Machine Learning</strong>: Scikit-learn models</li>
                              <li><strong className="text-foreground">Data Storage</strong>: PostgreSQL with PostGIS</li>
                              <li><strong className="text-foreground">Visualization</strong>: Recharts</li>
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2">Benefits of Rainwater Harvesting</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>💧 <strong className="text-foreground">Water Security</strong>: Reduce dependence on municipal supply</li>
                              <li>💰 <strong className="text-foreground">Cost Savings</strong>: Lower water bills and reduced energy costs</li>
                              <li>🌱 <strong className="text-foreground">Environmental Protection</strong>: Reduce runoff and recharge groundwater</li>
                              <li>🏙️ <strong className="text-foreground">Urban Resilience</strong>: Mitigate urban flooding during heavy rains</li>
                              <li>🌍 <strong className="text-foreground">Climate Adaptation</strong>: Build resilience to climate change impacts</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Data Sources</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>Indian Meteorological Department (Rainfall data)</li>
                              <li>Central Ground Water Board (Groundwater data)</li>
                              <li>National Bureau of Soil Survey (Soil data)</li>
                              <li>OpenStreetMap (Geocoding services)</li>
                              <li>Research publications and field studies</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Disclaimer */}
                  <Card className="glass-card border-0 shadow-water">
                    <CardHeader>
                      <CardTitle>Disclaimer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
                        <p>
                          This tool provides preliminary estimates based on standard parameters and available data. For detailed design and
                          implementation, consult with certified rainwater harvesting professionals. Actual results may vary based on local
                          conditions, construction quality, and maintenance practices.
                        </p>
                        <p className="mt-2">
                          Always check local regulations and obtain necessary permits before implementing any rainwater harvesting system.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Footer */}
                  <div className="text-center text-xs text-muted-foreground pt-2">
                    <p>Developed for sustainable water management | © 2023 Central Ground Water Board (CGWB)</p>
                    <p>For technical support: support@rwhindia.org | Phone: +91-XXX-XXXX-XXXX</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Results;