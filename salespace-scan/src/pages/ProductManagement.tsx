import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Search, 
  Upload, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  Tag
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { brandAPI, Brand, Product } from "@/lib/brandAPI";
import { API_BASE_URL } from "@/lib/api";

const ProductManagement = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for brand, categories, and products
  const [brand, setBrand] = useState<Brand | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // State for product dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form state
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load brand and products on component mount
  useEffect(() => {
    if (brandId) {
      loadBrandAndProducts(parseInt(brandId));
    }
  }, [brandId]);
  
  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);
  
  const loadBrandAndProducts = async (id: number) => {
    setIsLoading(true);
    try {
      const [brandData, categoriesData, productsData] = await Promise.all([
        brandAPI.getBrand(id),
        brandAPI.getBrandCategories(id),
        brandAPI.getBrandProducts(id)
      ]);
      
      setBrand(brandData);
      setCategories(categoriesData);
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      // If a category is selected, filter products by that category
      if (selectedCategoryId) {
        filterProductsByCategory(selectedCategoryId, productsData);
      }
    } catch (error) {
      console.error("Failed to load brand, categories, and products:", error);
      toast({
        title: "Error",
        description: "Failed to load brand data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterProductsByCategory = (categoryId: number | null, productsList = products) => {
    if (!categoryId) {
      setFilteredProducts(productsList);
      return;
    }
    
    const filtered = productsList.filter(product => product.category_id === categoryId);
    setFilteredProducts(filtered);
  };
  
  const handleCreateProduct = async () => {
    if (!brandId) return;
    
    if (!productName.trim()) {
      toast({
        title: "Error",
        description: "Product name is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let newProduct;
      
      // If a category is selected, create product in that category
      if (productCategoryId) {
        newProduct = await brandAPI.createProductInCategory(productCategoryId, {
          name: productName,
          description: productDescription,
          sku: productSku,
          price: productPrice ? parseFloat(productPrice) : undefined,
        });
      } else {
        // Create product directly under brand
        newProduct = await brandAPI.createProduct(parseInt(brandId), {
          name: productName,
          description: productDescription,
          sku: productSku,
          price: productPrice ? parseFloat(productPrice) : undefined,
          category_id: productCategoryId || undefined,
        });
      }
      
      // Upload image if provided
      if (imageFile && newProduct.id) {
        await brandAPI.uploadProductImage(newProduct.id, imageFile);
      }
      
      toast({
        title: "Success",
        description: "Product created successfully.",
      });
      
      // Reset form and close dialog
      resetForm();
      setIsCreateDialogOpen(false);
      
      // Reload products
      if (brandId) {
        loadBrandAndProducts(parseInt(brandId));
      }
    } catch (error) {
      console.error("Failed to create product:", error);
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    if (!productName.trim()) {
      toast({
        title: "Error",
        description: "Product name is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Update product
      await brandAPI.updateProduct(selectedProduct.id, {
        name: productName,
        description: productDescription,
        sku: productSku,
        price: productPrice ? parseFloat(productPrice) : undefined,
        category_id: productCategoryId || undefined,
      });
      
      // Upload image if provided
      if (imageFile) {
        await brandAPI.uploadProductImage(selectedProduct.id, imageFile);
      }
      
      toast({
        title: "Success",
        description: "Product updated successfully.",
      });
      
      // Reset form and close dialog
      resetForm();
      setIsEditDialogOpen(false);
      
      // Reload products
      if (brandId) {
        loadBrandAndProducts(parseInt(brandId));
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    try {
      await brandAPI.deleteProduct(selectedProduct.id);
      
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      
      // Reset form and close dialog
      resetForm();
      setIsDeleteDialogOpen(false);
      
      // Reload products
      if (brandId) {
        loadBrandAndProducts(parseInt(brandId));
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setProductDescription(product.description || "");
    setProductSku(product.sku || "");
    setProductPrice(product.price?.toString() || "");
    setProductCategoryId(product.category_id || null);
    setImagePreview(product.image_path ? `${API_BASE_URL}/agent/uploads/${product.image_path}` : null);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  const resetForm = () => {
    setProductName("");
    setProductDescription("");
    setProductSku("");
    setProductPrice("");
    setProductCategoryId(null);
    setImageFile(null);
    setImagePreview(null);
    setSelectedProduct(null);
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => navigate("/brands")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {brand ? brand.name : "Loading..."} Products
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage products for this brand
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Category Filter */}
        <div>
          <Select 
            value={selectedCategoryId?.toString() || ""} 
            onValueChange={(value) => {
              const categoryId = value ? parseInt(value) : null;
              setSelectedCategoryId(categoryId);
              filterProductsByCategory(categoryId);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name} ({category.product_count || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-xl font-medium text-center mb-2">No products found</p>
            <p className="text-muted-foreground text-center">
              {searchTerm ? "Try a different search term" : "Create your first product to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                {product.image_path ? (
                  <img
                    src={`${API_BASE_URL}/agent/uploads/${product.image_path}`}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400x200?text=No+Image";
                    }}
                  />
                ) : (
                  <Package className="w-16 h-16 text-gray-300" />
                )}
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>
                  {product.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  {product.category_name && (
                    <div className="flex items-center gap-2 mb-1">
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Category: {product.category_name}</span>
                    </div>
                  )}
                  {product.sku && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
                    </div>
                  )}
                  {product.price !== undefined && product.price !== null && (
                    <div className="text-sm font-medium">
                      Price: ${product.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => openDeleteDialog(product)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Product Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Add a new product to {brand?.name}. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productDescription">Description</Label>
              <Textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Enter product description"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productCategory">Category</Label>
              <Select 
                value={productCategoryId?.toString() || ""} 
                onValueChange={(value) => setProductCategoryId(value ? parseInt(value) : null)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="productCategory">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="productSku">SKU</Label>
                <Input
                  id="productSku"
                  value={productSku}
                  onChange={(e) => setProductSku(e.target.value)}
                  placeholder="Enter SKU"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productPrice">Price</Label>
                <Input
                  id="productPrice"
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="Enter price"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productImage">Product Image</Label>
              <div className="flex flex-col gap-2">
                {imagePreview && (
                  <div className="h-32 bg-gray-100 flex items-center justify-center mb-2 rounded-md overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Image Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                <Input
                  id="productImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("productImage")?.click()}
                  disabled={isSubmitting}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imageFile ? "Change Image" : "Upload Image"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProduct} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editProductName">Product Name *</Label>
              <Input
                id="editProductName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editProductDescription">Description</Label>
              <Textarea
                id="editProductDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Enter product description"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editProductCategory">Category</Label>
              <Select 
                value={productCategoryId?.toString() || ""} 
                onValueChange={(value) => setProductCategoryId(value ? parseInt(value) : null)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="editProductCategory">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editProductSku">SKU</Label>
                <Input
                  id="editProductSku"
                  value={productSku}
                  onChange={(e) => setProductSku(e.target.value)}
                  placeholder="Enter SKU"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editProductPrice">Price</Label>
                <Input
                  id="editProductPrice"
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="Enter price"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editProductImage">Product Image</Label>
              <div className="flex flex-col gap-2">
                {imagePreview && (
                  <div className="h-32 bg-gray-100 flex items-center justify-center mb-2 rounded-md overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Image Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                <Input
                  id="editProductImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("editProductImage")?.click()}
                  disabled={isSubmitting}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imageFile ? "Change Image" : "Update Image"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Update Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Product Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{selectedProduct?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductManagement;