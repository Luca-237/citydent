import React, { useState, useEffect } from 'react'; // 1. Importamos useEffect
import { Camera, MapPin, Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';

// Importaciones de shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const IncidentForm = () => {
    // 2. Estados para categorías y carga
    const [categorias, setCategorias] = useState([]);
    const [cargandoCategorias, setCargandoCategorias] = useState(true);

    const [formData, setFormData] = useState({
        titulo: '',
        categoriaId: '',
        descripcion: '',
        ubicacion: '', 
        coordenadas: null 
    });
    const [imagenes, setImagenes] = useState([]);

    // 3. Efecto para traer las categorías del Back
    useEffect(() => {
        const obtenerCategorias = async () => {
            try {
                // REEMPLAZA ESTA URL POR LA DE TU API
                const response = await fetch('http://localhost:8080/api/categorias'); 
                if (!response.ok) throw new Error('Error al obtener categorías');
                
                const data = await response.json();
                setCategorias(data); // Asumimos que data es un array de objetos [{id: 1, nombre: '...'}]
            } catch (error) {
                console.error("Error cargando categorías:", error);
            } finally {
                setCargandoCategorias(false);
            }
        };

        obtenerCategorias();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (value) => {
        setFormData(prev => ({ ...prev, categoriaId: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files).map((file) => ({
                file,
                preview: URL.createObjectURL(file) 
            }));
            setImagenes((prev) => [...prev, ...filesArray]);
        }
    };

    const removeImage = (index) => {
        setImagenes((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Datos a enviar al back:", { ...formData, imagenes });
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border-none md:border">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg hidden md:block">
                <CardTitle className="text-2xl">Reportar Incidente</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                    Proporciona los detalles para ayudar a la comunidad.
                </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="titulo">Título del incidente</Label>
                            <Input 
                                id="titulo"
                                name="titulo"
                                placeholder="Ej: Luminaria rota"
                                required
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría</Label>
                            {/* 4. Select dinámico */}
                            <Select onValueChange={handleCategoryChange} disabled={cargandoCategorias} required>
                                <SelectTrigger>
                                    <SelectValue placeholder={cargandoCategorias ? "Cargando..." : "Seleccionar..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categorias.length > 0 ? (
                                        categorias.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.nombre}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-xs text-muted-foreground text-center">No hay categorías</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-primary font-bold">
                            <MapPin className="h-4 w-4" /> Ubicación
                        </Label>
                        <div className="h-48 w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center bg-muted/50">
                            <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground italic text-center px-4">
                                [ El mapa se activará cuando selecciones el marcador ]
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción detallada</Label>
                        <Textarea 
                            id="descripcion"
                            name="descripcion"
                            placeholder="Describe lo que sucede..."
                            className="min-h-[100px]"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Camera className="h-4 w-4" /> Fotos del incidente
                        </Label>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground mt-1 text-center px-1">Añadir foto</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>

                            {imagenes.map((img, index) => (
                                <div key={index} className="relative w-24 h-24">
                                    <img src={img.preview} alt="preview" className="w-full h-full object-cover rounded-lg border" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={() => removeImage(index)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>

                <CardFooter>
                    <Button type="submit" className="w-full gap-2 text-lg font-bold shadow-md">
                        <Send className="h-5 w-5" /> Enviar Reporte
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default IncidentForm;