"""
Test script to generate different IIIF URL patterns for quality testing
"""
import requests
from bs4 import BeautifulSoup

def test_iiif_urls(handle_url):
    """Test different IIIF URL patterns and return them for manual testing"""
    
    print(f"Testing Handle.net URL: {handle_url}\n")
    
    # Step 1: Get the viewer page
    resp = requests.get(handle_url, timeout=10, allow_redirects=True)
    final_url = resp.url
    html = resp.text
    soup = BeautifulSoup(html, 'html.parser')
    
    # Step 2: Find div.dlts_image_map and extract data-manifest
    image_map_div = soup.find('div', class_='dlts_image_map')
    if not image_map_div:
        image_map_div = soup.find('div', {'class': lambda x: x and 'dlts_image_map' in x.lower()})
    
    if not image_map_div:
        print("ERROR: Could not find div.dlts_image_map")
        return []
    
    data_manifest = image_map_div.get('data-manifest')
    if not data_manifest:
        print("ERROR: Could not find data-manifest attribute")
        return []
    
    print(f"Found manifest URL: {data_manifest}\n")
    
    # Step 3: Fetch the IIIF manifest
    manifest_response = requests.get(data_manifest, timeout=10)
    if manifest_response.status_code != 200:
        print(f"ERROR: Failed to fetch manifest (status {manifest_response.status_code})")
        return []
    
    manifest_data = manifest_response.json()
    iiif_service_url = manifest_data.get('@id')
    
    if not iiif_service_url:
        # Try to extract from resource structure
        sequences = manifest_data.get('sequences', [])
        if sequences:
            canvases = sequences[0].get('canvases', [])
            if canvases:
                images = canvases[0].get('images', [])
                if images:
                    resource = images[0].get('resource', {})
                    service = resource.get('service', {})
                    iiif_service_url = service.get('@id') or service.get('id')
    
    if not iiif_service_url:
        print("ERROR: Could not extract IIIF service URL from manifest")
        return []
    
    print(f"Found IIIF service URL: {iiif_service_url}\n")
    print("=" * 80)
    print("TEST THESE URLS (copy and paste in browser to test quality):")
    print("=" * 80)
    print()
    
    # Test different URL patterns
    test_urls = []
    
    # Pattern 1: Full size, native quality
    url1 = f"{iiif_service_url}/full/full/0/native.jpg"
    test_urls.append(("Full size, native quality", url1))
    
    # Pattern 2: Full size, default quality
    url2 = f"{iiif_service_url}/full/full/0/default.jpg"
    test_urls.append(("Full size, default quality", url2))
    
    # Pattern 3: Full size, color quality
    url3 = f"{iiif_service_url}/full/full/0/color.jpg"
    test_urls.append(("Full size, color quality", url3))
    
    # Pattern 4: Max size (2000x2000), native quality
    url4 = f"{iiif_service_url}/full/2000,/0/native.jpg"
    test_urls.append(("Max 2000px width, native quality", url4))
    
    # Pattern 5: Max size (2000x2000), default quality
    url5 = f"{iiif_service_url}/full/2000,/0/default.jpg"
    test_urls.append(("Max 2000px width, default quality", url5))
    
    # Pattern 6: Max size (3000x3000), native quality
    url6 = f"{iiif_service_url}/full/3000,/0/native.jpg"
    test_urls.append(("Max 3000px width, native quality", url6))
    
    # Pattern 7: Max size (3000x3000), default quality
    url7 = f"{iiif_service_url}/full/3000,/0/default.jpg"
    test_urls.append(("Max 3000px width, default quality", url7))
    
    # Pattern 8: Exact size (2048x2048), native quality
    url8 = f"{iiif_service_url}/full/!2048,2048/0/native.jpg"
    test_urls.append(("Exact 2048x2048, native quality", url8))
    
    # Pattern 9: Exact size (2048x2048), default quality
    url9 = f"{iiif_service_url}/full/!2048,2048/0/default.jpg"
    test_urls.append(("Exact 2048x2048, default quality", url9))
    
    # Pattern 10: PNG format (lossless)
    url10 = f"{iiif_service_url}/full/full/0/native.png"
    test_urls.append(("Full size, PNG (lossless)", url10))
    
    # Pattern 11: Max size, PNG format
    url11 = f"{iiif_service_url}/full/3000,/0/native.png"
    test_urls.append(("Max 3000px, PNG (lossless)", url11))
    
    # Pattern 12: Square region, full size
    url12 = f"{iiif_service_url}/square/full/0/native.jpg"
    test_urls.append(("Square region, full size, native", url12))
    
    for i, (description, url) in enumerate(test_urls, 1):
        print(f"{i}. {description}")
        print(f"   {url}")
        print()
    
    print("=" * 80)
    print("Instructions:")
    print("1. Copy each URL above and paste it in your browser")
    print("2. Right-click the image and 'Save Image As' to download")
    print("3. Check the file size and visual quality")
    print("4. Tell me which URL number(s) look best!")
    print("=" * 80)
    
    return test_urls

if __name__ == "__main__":
    # Test with a sample Handle.net URL
    # You can change this to any Handle.net URL from your collection
    test_url = "http://hdl.handle.net/2333.1/h9w0w4wd"
    
    print("IIIF URL Quality Test Script")
    print("=" * 80)
    print()
    
    test_iiif_urls(test_url)





